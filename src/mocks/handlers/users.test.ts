import { afterEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import { userSchema, type NewUser } from '@/features/auth';
import { ApiError, apiRequest } from '@/shared/api/apiRequest';
import { actAs, INGRID_LEADER_DEPT_1, LARS_ADMIN, TINE_CASE_WORKER_DEPT_1 } from '@/test/mockUsers';
import { readDb } from '../db';

// F-004 user admin: list and add users (Admin only).

const newUser: NewUser = {
  firstName: 'Nina',
  surname: 'Newcomer',
  email: 'nina.newcomer@example.com',
  departmentId: 2,
  role: 'CaseWorker',
  primaryField: 'Social',
  fields: ['Social', 'ChildServices'],
};

const listUsers = () => apiRequest('/api/users', { schema: z.array(userSchema) });
const addUser = (body: unknown) =>
  apiRequest('/api/users', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    schema: userSchema,
  });

afterEach(() => {
  vi.useRealTimers();
});

describe('F-004 GET /api/users', () => {
  it('lists every user for Admin', async () => {
    actAs(LARS_ADMIN);

    expect(await listUsers()).toHaveLength(19);
  });

  it.each([
    ['a leader', INGRID_LEADER_DEPT_1],
    ['a case worker', TINE_CASE_WORKER_DEPT_1],
  ])('refuses %s with 403', async (_label, email) => {
    actAs(email);

    await expect(listUsers()).rejects.toEqual(new ApiError(403, '/api/users'));
  });
});

describe('F-004 POST /api/users', () => {
  it('adds an active user with an id and creation time, logged as "user added"', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-10-17T12:00:00Z'));
    const admin = actAs(LARS_ADMIN);

    const added = await addUser(newUser);

    expect(added).toEqual({
      ...newUser,
      id: expect.any(String) as unknown,
      isActive: true,
      createdAt: '2026-10-17T12:00:00.000Z',
      updatedAt: null,
    });
    expect(readDb().users).toHaveLength(20);
    expect(readDb().auditLog).toMatchObject([
      {
        userId: admin.id,
        action: 'UserAdded',
        result: 'Success',
        details: { addedUserId: added.id },
      },
    ]);
    expect(readDb().auditLog[0]?.caseId).toBeUndefined();
  });

  it.each(['tine.tester@example.com', 'Tine.Tester@Example.com'])(
    'rejects an email that is already used (%s) with 409',
    async (email) => {
      actAs(LARS_ADMIN);

      await expect(addUser({ ...newUser, email })).rejects.toEqual(new ApiError(409, '/api/users'));
      expect(readDb().users).toHaveLength(19);
    },
  );

  it.each([
    ['no first name', { ...newUser, firstName: ' ' }],
    ['an invalid email', { ...newUser, email: 'nina@' }],
    ['fields without the primary field', { ...newUser, fields: ['ChildServices'] }],
    ['a repeated field', { ...newUser, fields: ['Social', 'Social'] }],
    ['an unknown role', { ...newUser, role: 'Boss' }],
    ['an unknown department', { ...newUser, departmentId: 4 }],
  ])('rejects %s with 400', async (_label, body) => {
    actAs(LARS_ADMIN);

    await expect(addUser(body)).rejects.toEqual(new ApiError(400, '/api/users'));
    expect(readDb().users).toHaveLength(19);
  });

  it.each([
    ['a leader', INGRID_LEADER_DEPT_1],
    ['a case worker', TINE_CASE_WORKER_DEPT_1],
  ])('refuses %s with 403 and logs Denied', async (_label, email) => {
    const user = actAs(email);

    await expect(addUser(newUser)).rejects.toEqual(new ApiError(403, '/api/users'));
    expect(readDb().users).toHaveLength(19);
    expect(readDb().auditLog).toMatchObject([
      { userId: user.id, action: 'UserAdded', result: 'Denied' },
    ]);
  });
});
