import { http, HttpResponse } from 'msw';
import { z } from 'zod';
import { can, fieldSchema } from '@/features/auth';
import {
  lastSequenceInYear,
  nextCaseNumber,
  viewCase,
  type CaseResponse,
  type SupervisionCase,
} from '@/features/cases';
import { recordAudit } from '../auditLog';
import { currentUser, readDb, writeDb } from '../db';

const createCaseBodySchema = z.object({ field: fieldSchema });

export const caseHandlers = [
  // F-001: a leader creates a case in one of their fields, in their own department.
  http.post('/api/cases', async ({ request }) => {
    const body = createCaseBodySchema.safeParse(await request.json().catch(() => undefined));
    if (!body.success) return new HttpResponse(null, { status: 400 });

    const db = readDb();
    const user = currentUser(db);
    const { field } = body.data;

    if (!can(user, 'createCase', { field })) {
      writeDb(
        recordAudit(db, {
          userId: user.id,
          action: 'CaseCreated',
          result: 'Denied',
          details: { field },
        }),
      );
      return new HttpResponse(null, { status: 403 });
    }

    const year = new Date().getFullYear();
    const lastSequence = lastSequenceInYear(
      db.cases.map((existing) => existing.caseNumber),
      year,
    );
    const supervisionCase: SupervisionCase = {
      id: crypto.randomUUID(),
      caseNumber: nextCaseNumber(year, lastSequence),
      status: 'Unassigned',
      field,
      departmentId: user.departmentId,
      assignedTo: null,
      readAccess: [],
      healthPersonnel: [],
      companies: [],
    };

    writeDb(
      recordAudit(
        { ...db, cases: [...db.cases, supervisionCase] },
        {
          userId: user.id,
          action: 'CaseCreated',
          result: 'Success',
          supervisionCase,
          details: { caseNumber: supervisionCase.caseNumber, field },
        },
      ),
    );
    return HttpResponse.json(supervisionCase, { status: 201 });
  }),

  // F-002 / F-004: open a case. Admin gets the restricted view; nobody else without access gets
  // anything. Every opening is logged as "case opened" (F-005).
  http.get('/api/cases/:id', ({ params }) => {
    const db = readDb();
    const user = currentUser(db);
    const supervisionCase = db.cases.find((candidate) => candidate.id === params.id);
    if (!supervisionCase) return new HttpResponse(null, { status: 404 });

    const view = viewCase(user, supervisionCase);
    if (view.access === 'none') {
      writeDb(
        recordAudit(db, {
          userId: user.id,
          action: 'CaseOpened',
          result: 'Denied',
          supervisionCase,
        }),
      );
      return new HttpResponse(null, { status: 403 });
    }

    writeDb(
      recordAudit(db, {
        userId: user.id,
        action: 'CaseOpened',
        result: 'Success',
        supervisionCase,
        details: { view: view.access },
      }),
    );
    const caseWorker = db.users.find((candidate) => candidate.id === supervisionCase.assignedTo);
    const body: CaseResponse = {
      ...view,
      assignedCaseWorker: caseWorker
        ? {
            id: caseWorker.id,
            firstName: caseWorker.firstName,
            surname: caseWorker.surname,
            isActive: caseWorker.isActive,
          }
        : null,
    };
    return HttpResponse.json(body);
  }),
];
