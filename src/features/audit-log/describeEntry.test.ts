import { describe, expect, it } from 'vitest';
import { describeEntry, type AuditNames } from './describeEntry';
import type { AuditAction, AuditDetails, AuditEntry } from './types';

// F-005: an entry's details as a readable sentence.

const MAGNUS = crypto.randomUUID();
const NORA = crypto.randomUUID();
const PERSON = crypto.randomUUID();

const names: AuditNames = {
  user: (id) => ({ [MAGNUS]: 'Magnus Berg', [NORA]: 'Nora Strand' })[id],
  status: (status) => ({ Unassigned: 'Unassigned', InProgress: 'In progress' })[status] ?? status,
  party: (id) => (id === PERSON ? 'Fakefirst Fakelast' : undefined),
};
const withoutParties: AuditNames = { user: names.user, status: names.status };

function entry(action: AuditAction, details: AuditDetails = {}): AuditEntry {
  return {
    id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
    userId: MAGNUS,
    action,
    result: 'Success',
    details,
  };
}

describe('F-005 describeEntry', () => {
  it.each<[string, AuditAction, AuditDetails, string]>([
    [
      'case created',
      'CaseCreated',
      { caseNumber: '2026/0001', field: 'ChildServices' },
      'Field: Child services',
    ],
    ['a refused case creation', 'CaseCreated', {}, ''],
    ['the full view', 'CaseOpened', { view: 'full' }, 'Full view'],
    [
      'the restricted view',
      'CaseOpened',
      { view: 'restricted' },
      'Restricted view (no sensitive data)',
    ],
    ['a refused opening', 'CaseOpened', {}, ''],
    [
      'a first assignment',
      'CaseAssigned',
      { previousCaseWorkerId: null, newCaseWorkerId: NORA },
      'To Nora Strand',
    ],
    [
      'a reassignment',
      'CaseAssigned',
      { previousCaseWorkerId: MAGNUS, newCaseWorkerId: NORA },
      'To Nora Strand, instead of Magnus Berg',
    ],
    [
      'a borrowed case worker',
      'CaseAssigned',
      { previousCaseWorkerId: null, newCaseWorkerId: NORA, homeDepartmentId: 3 },
      'To Nora Strand, borrowed from the Department of Business Management',
    ],
    [
      'an unknown user',
      'CaseAssigned',
      { newCaseWorkerId: crypto.randomUUID() },
      'To an unknown user',
    ],
    [
      'a status change',
      'StatusChanged',
      { from: 'Unassigned', to: 'InProgress' },
      'Unassigned → In progress',
    ],
    [
      'a field change',
      'CaseUpdated',
      { change: 'FieldChanged', to: 'Social' },
      'Field changed to Social',
    ],
    [
      'a party, named',
      'CaseUpdated',
      { change: 'HealthPersonnelAdded', healthPersonnelId: PERSON },
      'Health personnel added: Fakefirst Fakelast',
    ],
    [
      'a party that is no longer in the case',
      'CaseUpdated',
      { change: 'CompanyRemoved', companyId: crypto.randomUUID() },
      'Company removed: (removed from the case)',
    ],
    [
      'a reaction, never which one',
      'ReactionGiven',
      { change: 'HealthPersonnelReactionGiven', healthPersonnelId: PERSON },
      'Reaction given to health personnel: Fakefirst Fakelast',
    ],
    ['a refused change', 'CaseUpdated', { change: 'CompanyAdded' }, 'Company added'],
    ['read access', 'ReadAccessGranted', { caseWorkerId: NORA }, 'Nora Strand'],
    [
      'read access removed by a move',
      'ReadAccessRemoved',
      { caseWorkerId: NORA, reason: 'MovedDepartment' },
      'Nora Strand, who moved to another department',
    ],
    ['a user added', 'UserAdded', { addedUserId: NORA }, 'Nora Strand'],
    [
      'a deactivation',
      'UserUpdated',
      { updatedUserId: NORA, isActive: false },
      'Deactivate Nora Strand',
    ],
    [
      'a reactivation',
      'UserUpdated',
      { updatedUserId: NORA, isActive: true },
      'Reactivate Nora Strand',
    ],
    [
      'new fields',
      'UserUpdated',
      {
        updatedUserId: NORA,
        change: 'Fields',
        primaryField: 'Social',
        fields: 'Social, ChildServices',
      },
      'Change the fields of Nora Strand to Social, Child services (primary: Social)',
    ],
    [
      'refused new fields',
      'UserUpdated',
      { updatedUserId: NORA, change: 'Fields' },
      'Change the fields of Nora Strand',
    ],
    [
      'a move',
      'UserUpdated',
      { updatedUserId: NORA, change: 'Department', fromDepartmentId: 1, toDepartmentId: 2 },
      'Move Nora Strand from the Department of Supervision to the Department of Child Welfare',
    ],
    [
      'a refused move',
      'UserUpdated',
      { updatedUserId: NORA, change: 'Department', toDepartmentId: 2 },
      'Move Nora Strand to the Department of Child Welfare',
    ],
  ])('describes %s', (_label, action, details, expected) => {
    expect(describeEntry(entry(action, details), names)).toBe(expected);
  });

  it('never names health personnel or companies without the party lookup (Admin)', () => {
    expect(
      describeEntry(
        entry('CaseUpdated', { change: 'HealthPersonnelAdded', healthPersonnelId: PERSON }),
        withoutParties,
      ),
    ).toBe('Health personnel added');
  });
});
