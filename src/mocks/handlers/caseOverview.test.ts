import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { overviewRowSchema } from '@/features/overview';
import { apiRequest } from '@/shared/api/apiRequest';
import { makeCase, makeCompany, makeHealthPersonnel } from '@/test/factories';
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

// F-003: GET /api/cases lists the cases each role may see (SPEC.md permission table, first row).

const tine = seedUser(TINE_CASE_WORKER_DEPT_1);
const magnus = seedUser('magnus.berg@example.com');
const emil = seedUser('emil.haugen@example.com'); // department 2

const tinesCase = makeCase({
  caseNumber: '2026/0001',
  departmentId: 1,
  status: 'InProgress',
  assignedTo: tine.id,
  healthPersonnel: [makeHealthPersonnel({ reaction: 'Prohibition' })],
  companies: [makeCompany({ reaction: 'NoReaction' })],
});
const readAccessCase = makeCase({
  caseNumber: '2026/0002',
  departmentId: 1,
  status: 'Assigned',
  assignedTo: magnus.id,
  readAccess: [tine.id],
});
const otherCaseInDepartment1 = makeCase({
  caseNumber: '2026/0003',
  departmentId: 1,
  status: 'Assigned',
  assignedTo: magnus.id,
});
const department2Case = makeCase({
  caseNumber: '2026/0004',
  departmentId: 2,
  field: 'ChildServices',
  status: 'Assigned',
  assignedTo: emil.id,
});
const unassignedCase = makeCase({ caseNumber: '2026/0005', departmentId: 1 });

function listCases() {
  return apiRequest('/api/cases', { schema: z.array(overviewRowSchema) });
}

function storeAll() {
  storeCases(tinesCase, readAccessCase, otherCaseInDepartment1, department2Case, unassignedCase);
}

describe('F-003 GET /api/cases', () => {
  it('CaseWorker: cases assigned to them and cases they have read access to', async () => {
    storeAll();
    actAs(TINE_CASE_WORKER_DEPT_1);

    const rows = await listCases();

    expect(rows.map((row) => row.caseNumber)).toEqual(['2026/0002', '2026/0001']);
  });

  it('Leader: every case in their department, none from others', async () => {
    storeAll();
    actAs(INGRID_LEADER_DEPT_1);

    const rows = await listCases();

    expect(rows.map((row) => row.caseNumber)).toEqual([
      '2026/0005',
      '2026/0003',
      '2026/0002',
      '2026/0001',
    ]);
  });

  it('Leader of another department: only their own department', async () => {
    storeAll();
    actAs(KARI_LEADER_DEPT_2);

    expect((await listCases()).map((row) => row.caseNumber)).toEqual(['2026/0004']);
  });

  it('Admin: every case, as restricted rows without reactions', async () => {
    storeAll();
    actAs(LARS_ADMIN);

    const rows = await listCases();

    expect(rows).toHaveLength(5);
    for (const row of rows) {
      expect(row.access).toBe('restricted');
      expect(row).not.toHaveProperty('reactions');
    }
  });

  it('gives each row its field, status, department, case worker and reactions', async () => {
    storeAll();
    actAs(TINE_CASE_WORKER_DEPT_1);

    const row = (await listCases()).find((candidate) => candidate.caseNumber === '2026/0001');

    expect(row).toEqual({
      access: 'full',
      id: tinesCase.id,
      caseNumber: '2026/0001',
      field: 'Health',
      status: 'InProgress',
      departmentId: 1,
      assignedCaseWorker: {
        id: tine.id,
        firstName: 'Tine',
        surname: 'Tester',
        isActive: true,
        departmentId: 1,
      },
      reactions: ['NoReaction', 'Prohibition'],
    });
  });

  it('sorts newest first, also across years and past 9999', async () => {
    storeCases(
      makeCase({ caseNumber: '2025/0900', departmentId: 1 }),
      makeCase({ caseNumber: '2026/10000', departmentId: 1 }),
      makeCase({ caseNumber: '2026/0002', departmentId: 1 }),
    );
    actAs(INGRID_LEADER_DEPT_1);

    expect((await listCases()).map((row) => row.caseNumber)).toEqual([
      '2026/10000',
      '2026/0002',
      '2025/0900',
    ]);
  });

  it('is not logged as opening any case', async () => {
    storeAll();
    actAs(INGRID_LEADER_DEPT_1);

    await listCases();

    expect(readDb().auditLog).toEqual([]);
  });
});
