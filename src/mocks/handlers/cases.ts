import { http, HttpResponse } from 'msw';
import { z } from 'zod';
import { can, fieldSchema } from '@/features/auth';
import { lastSequenceInYear, nextCaseNumber, type SupervisionCase } from '@/features/cases';
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
];
