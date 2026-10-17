import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { caseResponseSchema } from '@/features/cases';
import { notificationSchema } from '@/features/notifications';
import { apiRequest } from '@/shared/api/apiRequest';
import { makeCase } from '@/test/factories';
import { storeCases } from '@/test/mockCases';
import {
  actAs,
  INGRID_LEADER_DEPT_1,
  KARI_LEADER_DEPT_2,
  LARS_ADMIN,
  seedUser,
  TINE_CASE_WORKER_DEPT_1,
} from '@/test/mockUsers';
import { readDb, writeDb } from '../db';

// F-004: a leader is told about cases in their department whose case worker is deactivated.

const magnus = seedUser('magnus.berg@example.com');
const tine = seedUser(TINE_CASE_WORKER_DEPT_1);

const magnusCase = makeCase({
  caseNumber: '2026/0010',
  departmentId: 1,
  status: 'InProgress',
  assignedTo: magnus.id,
});
const magnusClosedCase = makeCase({
  caseNumber: '2026/0011',
  departmentId: 1,
  status: 'Closed',
  assignedTo: magnus.id,
});
const tinesCase = makeCase({
  caseNumber: '2026/0012',
  departmentId: 1,
  status: 'Assigned',
  assignedTo: tine.id,
});

function deactivateMagnus() {
  const db = readDb();
  writeDb({
    ...db,
    users: db.users.map((u) => (u.id === magnus.id ? { ...u, isActive: false } : u)),
  });
}

const notifications = () =>
  apiRequest('/api/notifications', { schema: z.array(notificationSchema) });

describe('F-004 GET /api/notifications', () => {
  it('tells the leader about open cases with a deactivated case worker', async () => {
    storeCases(magnusCase, magnusClosedCase, tinesCase);
    deactivateMagnus();
    actAs(INGRID_LEADER_DEPT_1);

    expect(await notifications()).toEqual([
      {
        type: 'DeactivatedCaseWorker',
        caseId: magnusCase.id,
        caseNumber: '2026/0010',
        caseWorker: { id: magnus.id, firstName: 'Magnus', surname: 'Berg', isActive: false },
      },
    ]);
  });

  it('has nothing while every case worker is active', async () => {
    storeCases(magnusCase, tinesCase);
    actAs(INGRID_LEADER_DEPT_1);

    expect(await notifications()).toEqual([]);
  });

  it.each([
    ['a leader of another department', KARI_LEADER_DEPT_2],
    ['a case worker', TINE_CASE_WORKER_DEPT_1],
    ['an admin', LARS_ADMIN],
  ])('has nothing for %s', async (_label, email) => {
    storeCases(magnusCase);
    deactivateMagnus();
    actAs(email);

    expect(await notifications()).toEqual([]);
  });

  it('disappears when the case is reassigned to an active case worker', async () => {
    storeCases(magnusCase);
    deactivateMagnus();
    actAs(INGRID_LEADER_DEPT_1);

    await apiRequest(`/api/cases/${magnusCase.id}/assignee`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ caseWorkerId: tine.id }),
      schema: caseResponseSchema,
    });

    expect(await notifications()).toEqual([]);
  });

  it('disappears when Admin reactivates the case worker', async () => {
    storeCases(magnusCase);
    deactivateMagnus();
    actAs(LARS_ADMIN);
    await apiRequest(`/api/users/${magnus.id}/reactivate`, {
      method: 'POST',
      schema: z.unknown(),
    });
    actAs(INGRID_LEADER_DEPT_1);

    expect(await notifications()).toEqual([]);
  });
});
