import { describe, expect, it } from 'vitest';
import type { SupervisionCase } from '@/features/cases';
import { makeCase, makeUser } from '@/test/factories';
import { can } from './permissions';

// F-004: one describe per row of the SPEC.md permission table, each with a test per role
// (docs/conventions/testing.md).

const leader = makeUser({ role: 'Leader', departmentId: 1, fields: ['Health', 'Social'] });
const otherDepartmentLeader = makeUser({ role: 'Leader', departmentId: 2 });
const caseWorker = makeUser({ role: 'CaseWorker', departmentId: 1 });
const otherCaseWorker = makeUser({ role: 'CaseWorker', departmentId: 1 });
const admin = makeUser({ role: 'Admin', departmentId: 1 });

/** A case in department 1, assigned to `caseWorker`. */
function departmentCase(overrides: Partial<SupervisionCase> = {}) {
  return makeCase({
    departmentId: 1,
    status: 'InProgress',
    assignedTo: caseWorker.id,
    ...overrides,
  });
}

const otherDepartmentCase = departmentCase({ departmentId: 2 });
const caseWithReadAccess = departmentCase({
  assignedTo: otherCaseWorker.id,
  readAccess: [caseWorker.id],
});
const unrelatedCase = departmentCase({ assignedTo: otherCaseWorker.id });
const closedCase = departmentCase({ status: 'Closed' });

describe('F-004 permissions: see cases in overview', () => {
  it('CaseWorker: cases assigned to them or with read access, nothing else', () => {
    expect(can(caseWorker, 'seeCaseInOverview', departmentCase())).toBe(true);
    expect(can(caseWorker, 'seeCaseInOverview', caseWithReadAccess)).toBe(true);
    expect(can(caseWorker, 'seeCaseInOverview', unrelatedCase)).toBe(false);
  });

  it('Leader: all cases in own department, none in other departments', () => {
    expect(can(leader, 'seeCaseInOverview', unrelatedCase)).toBe(true);
    expect(
      can(leader, 'seeCaseInOverview', departmentCase({ status: 'Unassigned', assignedTo: null })),
    ).toBe(true);
    expect(can(leader, 'seeCaseInOverview', otherDepartmentCase)).toBe(false);
  });

  it('Admin: all cases in all departments', () => {
    expect(can(admin, 'seeCaseInOverview', departmentCase())).toBe(true);
    expect(can(admin, 'seeCaseInOverview', otherDepartmentCase)).toBe(true);
  });
});

describe('F-004 permissions: create case', () => {
  it('CaseWorker: never', () => {
    expect(can(caseWorker, 'createCase', { field: 'Health' })).toBe(false);
  });

  it('Leader: only in own fields', () => {
    expect(can(leader, 'createCase', { field: 'Health' })).toBe(true);
    expect(can(leader, 'createCase', { field: 'Social' })).toBe(true);
    expect(can(leader, 'createCase', { field: 'ChildServices' })).toBe(false);
  });

  it('Admin: never', () => {
    expect(can(admin, 'createCase', { field: 'Health' })).toBe(false);
  });
});

describe('F-004 permissions: read case (full)', () => {
  it('CaseWorker: cases assigned to them or with read access, also when closed', () => {
    expect(can(caseWorker, 'readCase', departmentCase())).toBe(true);
    expect(can(caseWorker, 'readCase', caseWithReadAccess)).toBe(true);
    expect(can(caseWorker, 'readCase', closedCase)).toBe(true);
    expect(can(caseWorker, 'readCase', unrelatedCase)).toBe(false);
  });

  it('Leader: all cases in own department', () => {
    expect(can(leader, 'readCase', unrelatedCase)).toBe(true);
    expect(can(leader, 'readCase', otherDepartmentCase)).toBe(false);
  });

  it('Admin: never the full case', () => {
    expect(can(admin, 'readCase', departmentCase())).toBe(false);
  });
});

describe('F-004 permissions: read case (restricted, sensitive data hidden)', () => {
  it('CaseWorker: never', () => {
    expect(can(caseWorker, 'readCaseRestricted', departmentCase())).toBe(false);
  });

  it('Leader: never (reads the full case instead)', () => {
    expect(can(leader, 'readCaseRestricted', departmentCase())).toBe(false);
  });

  it('Admin: cases in all departments', () => {
    expect(can(admin, 'readCaseRestricted', departmentCase())).toBe(true);
    expect(can(admin, 'readCaseRestricted', otherDepartmentCase)).toBe(true);
  });
});

describe('F-004 permissions: edit case', () => {
  it('CaseWorker: only cases assigned to them that are not closed', () => {
    expect(can(caseWorker, 'editCase', departmentCase({ status: 'Assigned' }))).toBe(true);
    expect(can(caseWorker, 'editCase', departmentCase({ status: 'InProgress' }))).toBe(true);
    expect(can(caseWorker, 'editCase', closedCase)).toBe(false);
    expect(can(caseWorker, 'editCase', caseWithReadAccess)).toBe(false);
    expect(can(caseWorker, 'editCase', unrelatedCase)).toBe(false);
  });

  it('Leader: never, not even in own department', () => {
    expect(can(leader, 'editCase', departmentCase())).toBe(false);
  });

  it('Admin: never', () => {
    expect(can(admin, 'editCase', departmentCase())).toBe(false);
  });
});

describe('F-004 permissions: close case', () => {
  it('CaseWorker: only cases assigned to them that are in progress', () => {
    expect(can(caseWorker, 'closeCase', departmentCase({ status: 'InProgress' }))).toBe(true);
    expect(can(caseWorker, 'closeCase', departmentCase({ status: 'Assigned' }))).toBe(false);
    expect(can(caseWorker, 'closeCase', closedCase)).toBe(false);
    expect(can(caseWorker, 'closeCase', caseWithReadAccess)).toBe(false);
  });

  it('Leader: never', () => {
    expect(can(leader, 'closeCase', departmentCase())).toBe(false);
  });

  it('Admin: never', () => {
    expect(can(admin, 'closeCase', departmentCase())).toBe(false);
  });
});

describe('F-004 permissions: reopen closed case', () => {
  it('CaseWorker: never, not even their own case', () => {
    expect(can(caseWorker, 'reopenCase', closedCase)).toBe(false);
  });

  it('Leader: closed cases in own department only', () => {
    expect(can(leader, 'reopenCase', closedCase)).toBe(true);
    expect(can(leader, 'reopenCase', departmentCase({ status: 'InProgress' }))).toBe(false);
    expect(can(otherDepartmentLeader, 'reopenCase', closedCase)).toBe(false);
  });

  it('Admin: never', () => {
    expect(can(admin, 'reopenCase', closedCase)).toBe(false);
  });
});

describe('F-004 permissions: assign / reassign case', () => {
  it('CaseWorker: never', () => {
    expect(
      can(caseWorker, 'assignCase', departmentCase({ status: 'Unassigned', assignedTo: null })),
    ).toBe(false);
  });

  it('Leader: cases in own department that are not closed', () => {
    for (const status of ['Unassigned', 'Assigned', 'InProgress'] as const) {
      expect(can(leader, 'assignCase', departmentCase({ status }))).toBe(true);
    }
    expect(can(leader, 'assignCase', closedCase)).toBe(false);
    expect(can(otherDepartmentLeader, 'assignCase', departmentCase())).toBe(false);
  });

  it('Admin: never', () => {
    expect(can(admin, 'assignCase', departmentCase())).toBe(false);
  });
});

describe('F-004 permissions: give / remove read access', () => {
  it('CaseWorker: never', () => {
    expect(can(caseWorker, 'manageReadAccess', departmentCase())).toBe(false);
  });

  it('Leader: cases in own department that are not closed', () => {
    expect(can(leader, 'manageReadAccess', departmentCase())).toBe(true);
    expect(can(leader, 'manageReadAccess', closedCase)).toBe(false);
    expect(can(otherDepartmentLeader, 'manageReadAccess', departmentCase())).toBe(false);
  });

  it('Admin: never', () => {
    expect(can(admin, 'manageReadAccess', departmentCase())).toBe(false);
  });
});

describe('F-004 permissions: view audit log per case', () => {
  it('CaseWorker: never, not even their own case', () => {
    expect(can(caseWorker, 'viewCaseAuditLog', departmentCase())).toBe(false);
  });

  it('Leader: cases in own department, also when closed', () => {
    expect(can(leader, 'viewCaseAuditLog', departmentCase())).toBe(true);
    expect(can(leader, 'viewCaseAuditLog', closedCase)).toBe(true);
    expect(can(otherDepartmentLeader, 'viewCaseAuditLog', departmentCase())).toBe(false);
  });

  it('Admin: not per case (uses the global audit log)', () => {
    expect(can(admin, 'viewCaseAuditLog', departmentCase())).toBe(false);
  });
});

describe('F-004 permissions: view global audit log', () => {
  it('CaseWorker: never', () => {
    expect(can(caseWorker, 'viewGlobalAuditLog')).toBe(false);
  });

  it('Leader: never', () => {
    expect(can(leader, 'viewGlobalAuditLog')).toBe(false);
  });

  it('Admin: yes', () => {
    expect(can(admin, 'viewGlobalAuditLog')).toBe(true);
  });
});

describe('F-004 permissions: add users, deactivate users, change fields and department', () => {
  it('CaseWorker: never', () => {
    expect(can(caseWorker, 'manageUsers')).toBe(false);
  });

  it('Leader: never', () => {
    expect(can(leader, 'manageUsers')).toBe(false);
  });

  it('Admin: yes', () => {
    expect(can(admin, 'manageUsers')).toBe(true);
  });
});

describe('F-004 permissions: deactivated users', () => {
  it('may do nothing, whatever their role', () => {
    const inactive = (user: typeof leader) => ({ ...user, isActive: false });

    expect(can(inactive(caseWorker), 'readCase', departmentCase())).toBe(false);
    expect(can(inactive(caseWorker), 'editCase', departmentCase())).toBe(false);
    expect(can(inactive(leader), 'assignCase', departmentCase())).toBe(false);
    expect(can(inactive(leader), 'createCase', { field: 'Health' })).toBe(false);
    expect(can(inactive(admin), 'manageUsers')).toBe(false);
    expect(can(inactive(admin), 'seeCaseInOverview', departmentCase())).toBe(false);
  });
});

describe('can() call shape', () => {
  it('needs the right target for each action (checked by TypeScript)', () => {
    // @ts-expect-error assignCase needs the case
    expect(() => can(leader, 'assignCase')).toThrow();
    // @ts-expect-error manageUsers takes no target
    expect(can(admin, 'manageUsers', departmentCase())).toBe(true);
  });
});
