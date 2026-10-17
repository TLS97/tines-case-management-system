import { afterEach, describe, expect, it, vi } from 'vitest';
import { supervisionCaseSchema } from '@/features/cases';
import { ApiError, apiRequest } from '@/shared/api/apiRequest';
import {
  actAs,
  INGRID_LEADER_DEPT_1,
  KARI_LEADER_DEPT_2,
  LARS_ADMIN,
  TINE_CASE_WORKER_DEPT_1,
} from '@/test/mockUsers';
import { readDb } from '../db';

function postCase(body: unknown) {
  return apiRequest('/api/cases', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    schema: supervisionCaseSchema,
  });
}

afterEach(() => {
  vi.useRealTimers();
});

describe('F-001 POST /api/cases', () => {
  it('creates an Unassigned case in the leader’s department with the next case number', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-10-17T12:00:00Z'));
    const leader = actAs(INGRID_LEADER_DEPT_1);

    const created = await postCase({ field: 'Social' });

    expect(created).toMatchObject({
      caseNumber: '2026/0001',
      status: 'Unassigned',
      field: 'Social',
      departmentId: leader.departmentId,
      assignedTo: null,
      readAccess: [],
      healthPersonnel: [],
      companies: [],
    });
    expect(created.id).toMatch(/^[0-9a-f-]{36}$/);
    expect(readDb().cases).toEqual([created]);
  });

  it('logs "case created" with Success, without sensitive data', async () => {
    const leader = actAs(INGRID_LEADER_DEPT_1);

    const created = await postCase({ field: 'Health' });

    expect(readDb().auditLog).toMatchObject([
      {
        userId: leader.id,
        action: 'CaseCreated',
        caseId: created.id,
        result: 'Success',
        details: { caseNumber: created.caseNumber, field: 'Health' },
      },
    ]);
  });

  it('numbers cases in one sequence across departments', async () => {
    actAs(INGRID_LEADER_DEPT_1);
    const first = await postCase({ field: 'Health' });
    actAs(KARI_LEADER_DEPT_2);
    const second = await postCase({ field: 'ChildServices' });
    actAs(INGRID_LEADER_DEPT_1);
    const third = await postCase({ field: 'Social' });

    const year = new Date().getFullYear();
    expect([first.caseNumber, second.caseNumber, third.caseNumber]).toEqual([
      `${year}/0001`,
      `${year}/0002`,
      `${year}/0003`,
    ]);
    expect(second.departmentId).toBe(2);
  });

  it('starts at 0001 again in a new year', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    actAs(INGRID_LEADER_DEPT_1);
    vi.setSystemTime(new Date('2026-12-31T12:00:00Z'));
    await postCase({ field: 'Health' });
    await postCase({ field: 'Health' });

    vi.setSystemTime(new Date('2027-01-02T12:00:00Z'));
    const nextYear = await postCase({ field: 'Health' });

    expect(nextYear.caseNumber).toBe('2027/0001');
  });

  it.each([
    ['a case worker', TINE_CASE_WORKER_DEPT_1, 'Health'],
    ['an admin', LARS_ADMIN, 'Health'],
    ['a leader, in a field they do not have', INGRID_LEADER_DEPT_1, 'ChildServices'],
  ])('rejects %s with 403, logs Denied and creates nothing', async (_label, email, field) => {
    const user = actAs(email);

    await expect(postCase({ field })).rejects.toEqual(new ApiError(403, '/api/cases'));

    const db = readDb();
    expect(db.cases).toEqual([]);
    expect(db.auditLog).toMatchObject([
      { userId: user.id, action: 'CaseCreated', result: 'Denied', details: { field } },
    ]);
    expect(db.auditLog[0]?.caseId).toBeUndefined();
  });

  it('rejects an invalid body with 400', async () => {
    actAs(INGRID_LEADER_DEPT_1);

    await expect(postCase({ field: 'Space' })).rejects.toEqual(new ApiError(400, '/api/cases'));
    expect(readDb().cases).toEqual([]);
  });
});
