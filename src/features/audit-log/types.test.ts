import { describe, expect, it } from 'vitest';
import { AUDIT_ACTIONS, auditEntrySchema } from './types';

const validEntry = {
  id: '6f1c2a9e-0000-4000-8000-000000000001',
  timestamp: '2026-10-17T12:00:00.000Z',
  userId: '6f1c2a9e-0000-4000-8000-000000000002',
  action: 'CaseAssigned',
  caseId: '6f1c2a9e-0000-4000-8000-000000000003',
  result: 'Success',
  details: {
    previousCaseWorkerId: null,
    newCaseWorkerId: '6f1c2a9e-0000-4000-8000-000000000004',
  },
};

describe('AuditEntry schema (SPEC.md F-005)', () => {
  it('accepts a valid entry', () => {
    expect(auditEntrySchema.safeParse(validEntry).success).toBe(true);
  });

  it('has exactly the logged actions from SPEC.md', () => {
    expect(AUDIT_ACTIONS).toEqual([
      'CaseCreated',
      'CaseUpdated',
      'CaseAssigned',
      'StatusChanged',
      'ReactionGiven',
      'ReadAccessGranted',
      'ReadAccessRemoved',
      'CaseOpened',
      'UserAdded',
      'UserUpdated',
    ]);
  });

  it('allows entries without a case, such as "user added"', () => {
    const userAdded = { ...validEntry, action: 'UserAdded', caseId: undefined, details: {} };
    expect(auditEntrySchema.safeParse(userAdded).success).toBe(true);
  });

  it('only allows Success or Denied as result', () => {
    expect(auditEntrySchema.safeParse({ ...validEntry, result: 'Denied' }).success).toBe(true);
    expect(auditEntrySchema.safeParse({ ...validEntry, result: 'Failed' }).success).toBe(false);
  });

  it('keeps details flat: no nested objects', () => {
    expect(
      auditEntrySchema.safeParse({ ...validEntry, details: { person: { name: 'x' } } }).success,
    ).toBe(false);
  });
});
