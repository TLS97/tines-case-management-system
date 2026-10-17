import type { User } from '@/features/auth';
import type { SupervisionCase } from './types';

// F-004: who a leader can give read access to a case. Whether the leader may manage read access at
// all is can(user, 'manageReadAccess', case); this is about the case worker who receives it.

/**
 * An active case worker in the case's department who does not already have the case (assigned) or
 * read access to it. No field is required: read access only lets them look.
 */
export function canReceiveReadAccess(candidate: User, supervisionCase: SupervisionCase): boolean {
  return (
    candidate.role === 'CaseWorker' &&
    candidate.isActive &&
    candidate.departmentId === supervisionCase.departmentId &&
    candidate.id !== supervisionCase.assignedTo &&
    !supervisionCase.readAccess.includes(candidate.id)
  );
}
