import { http, HttpResponse } from 'msw';
import { z } from 'zod';
import { can, fieldSchema } from '@/features/auth';
import {
  isEligibleCaseWorker,
  lastSequenceInYear,
  nextCaseNumber,
  viewCase,
  type SupervisionCase,
} from '@/features/cases';
import { recordAudit } from '../auditLog';
import { caseResponse, toCaseWorkerSummary } from '../caseResponses';
import { currentUser, readDb, writeDb } from '../db';

const createCaseBodySchema = z.object({ field: fieldSchema });
const assignBodySchema = z.object({ caseWorkerId: z.uuid() });

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
    return HttpResponse.json(caseResponse(db, view));
  }),

  // F-004: the case workers a leader can assign the case to.
  http.get('/api/cases/:id/eligible-case-workers', ({ params }) => {
    const db = readDb();
    const user = currentUser(db);
    const supervisionCase = db.cases.find((candidate) => candidate.id === params.id);
    if (!supervisionCase) return new HttpResponse(null, { status: 404 });
    if (!can(user, 'assignCase', supervisionCase)) return new HttpResponse(null, { status: 403 });

    const eligible = db.users
      .filter((candidate) => isEligibleCaseWorker(candidate, supervisionCase))
      .map(toCaseWorkerSummary);
    return HttpResponse.json(eligible);
  }),

  // F-004: assign or reassign the case. Unassigned becomes Assigned; otherwise the status stays.
  http.put('/api/cases/:id/assignee', async ({ params, request }) => {
    const body = assignBodySchema.safeParse(await request.json().catch(() => undefined));
    if (!body.success) return new HttpResponse(null, { status: 400 });

    const db = readDb();
    const user = currentUser(db);
    const supervisionCase = db.cases.find((candidate) => candidate.id === params.id);
    if (!supervisionCase) return new HttpResponse(null, { status: 404 });
    const { caseWorkerId } = body.data;

    if (!can(user, 'assignCase', supervisionCase)) {
      writeDb(
        recordAudit(db, {
          userId: user.id,
          action: 'CaseAssigned',
          result: 'Denied',
          supervisionCase,
          details: { newCaseWorkerId: caseWorkerId },
        }),
      );
      return new HttpResponse(null, { status: 403 });
    }

    const caseWorker = db.users.find((candidate) => candidate.id === caseWorkerId);
    const isSameCaseWorker = supervisionCase.assignedTo === caseWorkerId;
    if (!caseWorker || !isEligibleCaseWorker(caseWorker, supervisionCase) || isSameCaseWorker) {
      return new HttpResponse(null, { status: 400 });
    }

    const updated: SupervisionCase = {
      ...supervisionCase,
      assignedTo: caseWorker.id,
      status: supervisionCase.status === 'Unassigned' ? 'Assigned' : supervisionCase.status,
    };
    let next = {
      ...db,
      cases: db.cases.map((existing) => (existing.id === updated.id ? updated : existing)),
    };
    next = recordAudit(next, {
      userId: user.id,
      action: 'CaseAssigned',
      result: 'Success',
      supervisionCase: updated,
      details: { previousCaseWorkerId: supervisionCase.assignedTo, newCaseWorkerId: caseWorker.id },
    });
    if (updated.status !== supervisionCase.status) {
      next = recordAudit(next, {
        userId: user.id,
        action: 'StatusChanged',
        result: 'Success',
        supervisionCase: updated,
        details: { from: supervisionCase.status, to: updated.status },
      });
    }
    writeDb(next);
    return HttpResponse.json(caseResponse(next, { access: 'full', supervisionCase: updated }));
  }),
];
