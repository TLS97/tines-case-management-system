import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { blockingCaseSchema } from '@/features/admin';
import { userSchema } from '@/features/auth';
import { ApiError, apiRequest } from '@/shared/api/apiRequest';
import { makeCase } from '@/test/factories';
import { storeCases } from '@/test/mockCases';
import { actAs, INGRID_LEADER_DEPT_1, LARS_ADMIN, seedUser } from '@/test/mockUsers';
import { readDb } from '../db';

// F-004: Admin changes a user's fields and moves them to another department.

const magnus = seedUser('magnus.berg@example.com'); // dept 1, Health (primary) + Social
const sofie = seedUser('sofie.lunde@example.com'); // dept 1

function put(path: string, body: unknown) {
  return apiRequest(path, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    schema: userSchema,
  });
}
const changeFields = (id: string, body: unknown) => put(`/api/users/${id}/fields`, body);
const move = (id: string, departmentId: number) =>
  put(`/api/users/${id}/department`, { departmentId });
const blockingCases = (id: string) =>
  apiRequest(`/api/users/${id}/blocking-cases`, { schema: z.array(blockingCaseSchema) });

describe('F-004 PUT /api/users/:id/fields', () => {
  it('changes the fields, keeps the user on their cases and logs "user updated"', async () => {
    const healthCase = makeCase({
      departmentId: 1,
      field: 'Health',
      status: 'InProgress',
      assignedTo: magnus.id,
    });
    storeCases(healthCase);
    const admin = actAs(LARS_ADMIN);

    const updated = await changeFields(magnus.id, { primaryField: 'Social', fields: ['Social'] });

    expect(updated).toMatchObject({ primaryField: 'Social', fields: ['Social'] });
    expect(readDb().cases[0]?.assignedTo).toBe(magnus.id);
    expect(readDb().auditLog).toMatchObject([
      {
        userId: admin.id,
        action: 'UserUpdated',
        result: 'Success',
        details: {
          updatedUserId: magnus.id,
          change: 'Fields',
          primaryField: 'Social',
          fields: 'Social',
        },
      },
    ]);
  });

  it.each([
    ['fields without the primary field', { primaryField: 'Social', fields: ['Health'] }],
    ['no fields', { primaryField: 'Health', fields: [] }],
    ['the same fields as now', { primaryField: 'Health', fields: ['Social', 'Health'] }],
  ])('rejects %s with 400', async (_label, body) => {
    actAs(LARS_ADMIN);

    await expect(changeFields(magnus.id, body)).rejects.toEqual(
      new ApiError(400, `/api/users/${magnus.id}/fields`),
    );
  });

  it('refuses a leader with 403 and logs Denied', async () => {
    const leader = actAs(INGRID_LEADER_DEPT_1);

    await expect(
      changeFields(magnus.id, { primaryField: 'Social', fields: ['Social'] }),
    ).rejects.toEqual(new ApiError(403, `/api/users/${magnus.id}/fields`));
    expect(readDb().auditLog).toMatchObject([
      { userId: leader.id, action: 'UserUpdated', result: 'Denied' },
    ]);
  });
});

describe('F-004 moving a user to another department', () => {
  const openCase = makeCase({
    caseNumber: '2026/0010',
    departmentId: 1,
    status: 'InProgress',
    assignedTo: magnus.id,
  });
  const closedCase = makeCase({
    caseNumber: '2026/0011',
    departmentId: 1,
    status: 'Closed',
    assignedTo: magnus.id,
  });
  const borrowedCase = makeCase({
    caseNumber: '2026/0012',
    departmentId: 2,
    field: 'Health',
    status: 'Assigned',
    assignedTo: magnus.id,
  });

  it('is blocked while the user is case worker of open cases in their department; those are listed', async () => {
    storeCases(openCase, closedCase, borrowedCase);
    actAs(LARS_ADMIN);

    expect(await blockingCases(magnus.id)).toEqual([
      { caseId: openCase.id, caseNumber: '2026/0010', status: 'InProgress' },
    ]);
    await expect(move(magnus.id, 2)).rejects.toEqual(
      new ApiError(409, `/api/users/${magnus.id}/department`),
    );
    expect(readDb().users.find((u) => u.id === magnus.id)?.departmentId).toBe(1);
  });

  it('moves the user once nothing blocks it; closed and borrowed cases stay as they are', async () => {
    storeCases(closedCase, borrowedCase);
    const admin = actAs(LARS_ADMIN);

    const moved = await move(magnus.id, 2);

    expect(moved.departmentId).toBe(2);
    expect(readDb().cases.map((c) => c.assignedTo)).toEqual([magnus.id, magnus.id]);
    expect(readDb().auditLog).toMatchObject([
      {
        userId: admin.id,
        action: 'UserUpdated',
        details: {
          updatedUserId: magnus.id,
          change: 'Department',
          fromDepartmentId: 1,
          toDepartmentId: 2,
        },
      },
    ]);
  });

  it('removes read access to cases in the old department, and logs each removal', async () => {
    const readAccessCase = makeCase({
      caseNumber: '2026/0013',
      departmentId: 1,
      assignedTo: magnus.id,
      status: 'Closed',
      readAccess: [sofie.id],
    });
    storeCases(readAccessCase);
    actAs(LARS_ADMIN);

    await move(sofie.id, 3);

    expect(readDb().cases[0]?.readAccess).toEqual([]);
    expect(readDb().auditLog.map((entry) => entry.action)).toEqual([
      'ReadAccessRemoved',
      'UserUpdated',
    ]);
    expect(readDb().auditLog[0]).toMatchObject({
      caseId: readAccessCase.id,
      details: { caseWorkerId: sofie.id },
    });
  });

  it('rejects moving to the department the user is already in (400)', async () => {
    actAs(LARS_ADMIN);

    await expect(move(magnus.id, 1)).rejects.toEqual(
      new ApiError(400, `/api/users/${magnus.id}/department`),
    );
  });

  it('refuses a leader with 403 and logs Denied', async () => {
    actAs(INGRID_LEADER_DEPT_1);

    await expect(move(magnus.id, 2)).rejects.toEqual(
      new ApiError(403, `/api/users/${magnus.id}/department`),
    );
    await expect(blockingCases(magnus.id)).rejects.toEqual(
      new ApiError(403, `/api/users/${magnus.id}/blocking-cases`),
    );
    expect(readDb().auditLog).toMatchObject([
      {
        action: 'UserUpdated',
        result: 'Denied',
        details: { change: 'Department', toDepartmentId: 2 },
      },
    ]);
  });
});
