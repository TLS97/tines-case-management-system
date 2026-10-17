import type { SupervisionCase } from '@/features/cases';
import type { Field, User } from './types';

// The permission table from SPEC.md, as code. Every permission check in the app and in the mock API
// goes through can(); never check roles inline (CLAUDE.md). Frontend checks only shape the UI; a
// future backend must enforce the same rules (docs/conventions/security.md).

/** What each action is checked against. Actions without a target apply to the whole app. */
interface ActionTargets {
  /** See the case in the case overview (F-003). */
  seeCaseInOverview: SupervisionCase;
  /** Create a case in a field (F-001). The case gets the leader's own department. */
  createCase: { field: Field };
  /** Open the case with all its data. */
  readCase: SupervisionCase;
  /** Open the case with sensitive case data left out (Admin). */
  readCaseRestricted: SupervisionCase;
  /** Change field, health personnel, companies and reactions (F-002). */
  editCase: SupervisionCase;
  /** Close the case (F-002). Whether every party has a reaction is checked separately. */
  closeCase: SupervisionCase;
  /** Reopen a closed case (F-004). */
  reopenCase: SupervisionCase;
  /** Assign or reassign the case (F-004). Who it can go to is checked separately. */
  assignCase: SupervisionCase;
  /** Give or remove read access to the case (F-004). */
  manageReadAccess: SupervisionCase;
  /** View the audit log for one case (F-005). */
  viewCaseAuditLog: SupervisionCase;
  /** See the own department's case workers' cases in other departments, the "Lent out" list (F-004). */
  seeLentOutCases: undefined;
  /** View the global audit log (F-005). */
  viewGlobalAuditLog: undefined;
  /** Add, deactivate and reactivate users, change a user's fields and department (F-004). */
  manageUsers: undefined;
}

export type Action = keyof ActionTargets;

type TargetArgs<A extends Action> = ActionTargets[A] extends undefined ? [] : [ActionTargets[A]];

type Rule<A extends Action> = (user: User, ...target: TargetArgs<A>) => boolean;

const isOwnDepartment = (user: User, supervisionCase: SupervisionCase) =>
  supervisionCase.departmentId === user.departmentId;

const isAssignedTo = (user: User, supervisionCase: SupervisionCase) =>
  supervisionCase.assignedTo === user.id;

const hasReadAccess = (user: User, supervisionCase: SupervisionCase) =>
  supervisionCase.readAccess.includes(user.id);

const isClosed = (supervisionCase: SupervisionCase) => supervisionCase.status === 'Closed';

// One rule per row in the SPEC.md permission table, by role.
const RULES: { [A in Action]: Rule<A> } = {
  seeCaseInOverview: (user, c) => {
    switch (user.role) {
      case 'CaseWorker':
        return isAssignedTo(user, c) || hasReadAccess(user, c);
      case 'Leader':
        return isOwnDepartment(user, c);
      case 'Admin':
        return true;
    }
  },
  createCase: (user, { field }) => user.role === 'Leader' && user.fields.includes(field),
  readCase: (user, c) => {
    switch (user.role) {
      case 'CaseWorker':
        return isAssignedTo(user, c) || hasReadAccess(user, c);
      case 'Leader':
        return isOwnDepartment(user, c);
      case 'Admin':
        return false;
    }
  },
  readCaseRestricted: (user) => user.role === 'Admin',
  editCase: (user, c) => user.role === 'CaseWorker' && isAssignedTo(user, c) && !isClosed(c),
  // Only an InProgress case can be closed: Closed is final, and an Assigned case has had no changes
  // yet, so it cannot have reactions.
  closeCase: (user, c) =>
    user.role === 'CaseWorker' && isAssignedTo(user, c) && c.status === 'InProgress',
  reopenCase: (user, c) => user.role === 'Leader' && isOwnDepartment(user, c) && isClosed(c),
  assignCase: (user, c) => user.role === 'Leader' && isOwnDepartment(user, c) && !isClosed(c),
  manageReadAccess: (user, c) => user.role === 'Leader' && isOwnDepartment(user, c) && !isClosed(c),
  viewCaseAuditLog: (user, c) => user.role === 'Leader' && isOwnDepartment(user, c),
  seeLentOutCases: (user) => user.role === 'Leader',
  viewGlobalAuditLog: (user) => user.role === 'Admin',
  manageUsers: (user) => user.role === 'Admin',
};

/**
 * Whether the user may do the action. A deactivated user may do nothing.
 *
 * @example can(user, 'assignCase', supervisionCase)
 * @example can(user, 'createCase', { field: 'Health' })
 * @example can(user, 'manageUsers')
 */
export function can<A extends Action>(user: User, action: A, ...target: TargetArgs<A>): boolean {
  if (!user.isActive) return false;
  const rule: Rule<A> = RULES[action];
  return rule(user, ...target);
}
