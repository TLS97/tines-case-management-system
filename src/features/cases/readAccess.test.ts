import { describe, expect, it } from 'vitest';
import { makeCase, makeUser } from '@/test/factories';
import { canReceiveReadAccess } from './readAccess';

describe('F-004 who can be given read access', () => {
  const caseWorker = makeUser({
    role: 'CaseWorker',
    departmentId: 1,
    fields: ['Social'],
    primaryField: 'Social',
  });
  const healthCase = makeCase({
    departmentId: 1,
    field: 'Health',
    assignedTo: crypto.randomUUID(),
  });

  it('an active case worker in the case’s department, even without the case’s field', () => {
    expect(canReceiveReadAccess(caseWorker, healthCase)).toBe(true);
  });

  it.each([
    ['inactive', () => ({ user: { ...caseWorker, isActive: false }, target: healthCase })],
    [
      'in another department',
      () => ({ user: { ...caseWorker, departmentId: 2 as const }, target: healthCase }),
    ],
    ['a leader', () => ({ user: { ...caseWorker, role: 'Leader' as const }, target: healthCase })],
    [
      'the assigned case worker',
      () => ({ user: caseWorker, target: { ...healthCase, assignedTo: caseWorker.id } }),
    ],
    [
      'someone who already has read access',
      () => ({ user: caseWorker, target: { ...healthCase, readAccess: [caseWorker.id] } }),
    ],
  ])('not someone who is %s', (_label, make) => {
    const { user, target } = make();
    expect(canReceiveReadAccess(user, target)).toBe(false);
  });
});
