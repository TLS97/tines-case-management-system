import type { User } from '@/features/auth';
import type { CaseResponse, CaseView, CaseWorkerSummary } from '@/features/cases';
import type { MockDb } from './db';

export function toCaseWorkerSummary(user: User): CaseWorkerSummary {
  return {
    id: user.id,
    firstName: user.firstName,
    surname: user.surname,
    isActive: user.isActive,
    departmentId: user.departmentId,
  };
}

/** The case as the user may see it, with the assigned case worker's name. */
export function caseResponse(
  db: MockDb,
  view: Exclude<CaseView, { access: 'none' }>,
): CaseResponse {
  const caseWorker = db.users.find((candidate) => candidate.id === view.supervisionCase.assignedTo);
  return { ...view, assignedCaseWorker: caseWorker ? toCaseWorkerSummary(caseWorker) : null };
}
