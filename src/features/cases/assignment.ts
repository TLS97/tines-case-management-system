import type { User } from '@/features/auth';
import type { SupervisionCase } from './types';

// F-004: who a case can be assigned to. Whether the acting leader may assign at all is
// can(user, 'assignCase', case); this is about the case worker who receives it.

/**
 * An active case worker with access to the case's field. They can be from the case's department (the
 * leader's own) or borrowed from another department; the home department does not have to approve.
 */
export function isEligibleCaseWorker(candidate: User, supervisionCase: SupervisionCase): boolean {
  return (
    candidate.role === 'CaseWorker' &&
    candidate.isActive &&
    candidate.fields.includes(supervisionCase.field)
  );
}

/** A case worker is borrowed for a case in another department than their own (their home department). */
export function isBorrowed(
  caseWorker: Pick<User, 'departmentId'>,
  supervisionCase: Pick<SupervisionCase, 'departmentId'>,
): boolean {
  return caseWorker.departmentId !== supervisionCase.departmentId;
}
