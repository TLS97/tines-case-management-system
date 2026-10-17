import type { User } from '@/features/auth';
import type { SupervisionCase } from './types';

// F-004: who a case can be assigned to. Whether the acting leader may assign at all is
// can(user, 'assignCase', case); this is about the case worker who receives it.

/**
 * An active case worker in the case's department (the leader's own department) with access to the
 * case's field.
 */
export function isEligibleCaseWorker(candidate: User, supervisionCase: SupervisionCase): boolean {
  return (
    candidate.role === 'CaseWorker' &&
    candidate.isActive &&
    candidate.departmentId === supervisionCase.departmentId &&
    candidate.fields.includes(supervisionCase.field)
  );
}
