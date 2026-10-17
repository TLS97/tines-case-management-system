import { describe, expect, it } from 'vitest';
import { makeCase, makeUser } from '@/test/factories';
import { isBorrowed, isEligibleCaseWorker } from './assignment';

describe('F-004 who a case can be assigned to', () => {
  const healthCase = makeCase({ departmentId: 1, field: 'Health' });
  const eligible = makeUser({ role: 'CaseWorker', departmentId: 1, fields: ['Health'] });

  it('an active case worker in the department with the case’s field', () => {
    expect(isEligibleCaseWorker(eligible, healthCase)).toBe(true);
  });

  it('also when the field is not their primary field', () => {
    const candidate = makeUser({
      role: 'CaseWorker',
      departmentId: 1,
      primaryField: 'Social',
      fields: ['Social', 'Health'],
    });

    expect(isEligibleCaseWorker(candidate, healthCase)).toBe(true);
  });

  it('also a case worker from another department, who is then borrowed', () => {
    const fromDepartment3 = { ...eligible, departmentId: 3 as const };

    expect(isEligibleCaseWorker(fromDepartment3, healthCase)).toBe(true);
    expect(isBorrowed(fromDepartment3, healthCase)).toBe(true);
    expect(isBorrowed(eligible, healthCase)).toBe(false);
  });

  it.each([
    ['inactive', { isActive: false }],
    ['without the case’s field', { primaryField: 'Social' as const, fields: ['Social' as const] }],
    ['a leader', { role: 'Leader' as const }],
    ['an admin', { role: 'Admin' as const }],
  ])('not someone who is %s', (_label, overrides) => {
    expect(isEligibleCaseWorker({ ...eligible, ...overrides }, healthCase)).toBe(false);
  });
});
