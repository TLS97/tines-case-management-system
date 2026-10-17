import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { lentOutCaseSchema } from '@/features/overview';
import { ApiError, apiRequest } from '@/shared/api/apiRequest';
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
import { readDb } from '../db';

// F-004: the leader of a case worker's home department sees the cases they are borrowed for.

const magnus = seedUser('magnus.berg@example.com'); // dept 1
const maja = seedUser('maja.dahl@example.com'); // dept 3

const borrowedByDept2 = makeCase({
  caseNumber: '2026/0020',
  departmentId: 2,
  status: 'Assigned',
  assignedTo: magnus.id,
});
const borrowedByDept3 = makeCase({
  caseNumber: '2026/0021',
  departmentId: 3,
  status: 'InProgress',
  assignedTo: magnus.id,
});
const closedInDept2 = makeCase({
  caseNumber: '2026/0022',
  departmentId: 2,
  status: 'Closed',
  assignedTo: magnus.id,
});
const ownCase = makeCase({
  caseNumber: '2026/0023',
  departmentId: 1,
  status: 'Assigned',
  assignedTo: magnus.id,
});
const dept3WorkerInDept1 = makeCase({
  caseNumber: '2026/0024',
  departmentId: 1,
  status: 'Assigned',
  assignedTo: maja.id,
});

const lentOut = () => apiRequest('/api/lent-out-cases', { schema: z.array(lentOutCaseSchema) });

describe('F-004 GET /api/lent-out-cases', () => {
  it('lists the leader’s case workers on open cases in other departments, newest first', async () => {
    storeCases(borrowedByDept2, borrowedByDept3, closedInDept2, ownCase, dept3WorkerInDept1);
    actAs(INGRID_LEADER_DEPT_1);

    expect(await lentOut()).toEqual([
      {
        caseId: borrowedByDept3.id,
        caseNumber: '2026/0021',
        departmentId: 3,
        caseWorker: {
          id: magnus.id,
          firstName: 'Magnus',
          surname: 'Berg',
          isActive: true,
          departmentId: 1,
        },
      },
      expect.objectContaining({ caseId: borrowedByDept2.id, departmentId: 2 }) as unknown,
    ]);
    expect(readDb().auditLog).toEqual([]);
  });

  it('is empty for a leader whose case workers are not lent out', async () => {
    storeCases(borrowedByDept2, ownCase);
    actAs(KARI_LEADER_DEPT_2);

    expect(await lentOut()).toEqual([]);
  });

  it.each([
    ['a case worker', TINE_CASE_WORKER_DEPT_1],
    ['an admin', LARS_ADMIN],
  ])('refuses %s with 403', async (_label, email) => {
    storeCases(borrowedByDept2);
    actAs(email);

    await expect(lentOut()).rejects.toEqual(new ApiError(403, '/api/lent-out-cases'));
  });
});
