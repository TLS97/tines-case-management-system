import { http, HttpResponse } from 'msw';
import { can, type Action } from '@/features/auth';
import { isReadyToClose, type CaseStatus, type SupervisionCase } from '@/features/cases';
import { recordAudit } from '../auditLog';
import { caseResponse } from '../caseResponses';
import { currentUser, readDb, writeDb } from '../db';

// F-002 / F-004: the assigned case worker closes a case (only when every party has a reaction);
// a leader reopens it. Both are logged as "status changed" (F-005).

interface StatusChange {
  action: Extract<Action, 'closeCase' | 'reopenCase'>;
  to: CaseStatus;
  /** Extra condition on the case itself (not on the user); 409 when it is not met. */
  isAllowedFor?: (supervisionCase: SupervisionCase) => boolean;
}

function changeStatus(caseId: unknown, change: StatusChange): Response {
  const db = readDb();
  const user = currentUser(db);
  const supervisionCase = db.cases.find((candidate) => candidate.id === caseId);
  if (!supervisionCase) return new HttpResponse(null, { status: 404 });

  if (!can(user, change.action, supervisionCase)) {
    writeDb(
      recordAudit(db, {
        userId: user.id,
        action: 'StatusChanged',
        result: 'Denied',
        supervisionCase,
        details: { from: supervisionCase.status, to: change.to },
      }),
    );
    return new HttpResponse(null, { status: 403 });
  }
  if (change.isAllowedFor && !change.isAllowedFor(supervisionCase)) {
    return new HttpResponse(null, { status: 409 });
  }

  const updated: SupervisionCase = { ...supervisionCase, status: change.to };
  const next = recordAudit(
    {
      ...db,
      cases: db.cases.map((existing) => (existing.id === updated.id ? updated : existing)),
    },
    {
      userId: user.id,
      action: 'StatusChanged',
      result: 'Success',
      supervisionCase: updated,
      details: { from: supervisionCase.status, to: change.to },
    },
  );
  writeDb(next);
  return HttpResponse.json(caseResponse(next, { access: 'full', supervisionCase: updated }));
}

export const caseStatusHandlers = [
  http.post('/api/cases/:id/close', ({ params }) =>
    changeStatus(params.id, { action: 'closeCase', to: 'Closed', isAllowedFor: isReadyToClose }),
  ),

  http.post('/api/cases/:id/reopen', ({ params }) =>
    changeStatus(params.id, { action: 'reopenCase', to: 'InProgress' }),
  ),
];
