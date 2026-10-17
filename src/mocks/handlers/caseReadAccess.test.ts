import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { caseResponseSchema, readAccessResponseSchema } from '@/features/cases';
import { overviewRowSchema } from '@/features/overview';
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
import { readDb, writeDb } from '../db';

// F-004: read access (SPEC.md permission table "Give / remove read access").

const SOFIE = 'sofie.lunde@example.com'; // CaseWorker, dept 1, Social only
const sofie = seedUser(SOFIE);
const magnus = seedUser('magnus.berg@example.com');
const emil = seedUser('emil.haugen@example.com'); // dept 2

const healthCase = makeCase({
  caseNumber: '2026/0040',
  departmentId: 1,
  field: 'Health',
  status: 'InProgress',
  assignedTo: magnus.id,
});

const listAccess = (id: string) =>
  apiRequest(`/api/cases/${id}/read-access`, { schema: readAccessResponseSchema });
const grant = (id: string, caseWorkerId: string) =>
  apiRequest(`/api/cases/${id}/read-access`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ caseWorkerId }),
    schema: readAccessResponseSchema,
  });
const revoke = (id: string, caseWorkerId: string) =>
  apiRequest(`/api/cases/${id}/read-access/${caseWorkerId}`, {
    method: 'DELETE',
    schema: readAccessResponseSchema,
  });

describe('F-004 read access endpoints', () => {
  it('lists the department’s other active case workers as candidates', async () => {
    storeCases(healthCase);
    actAs(INGRID_LEADER_DEPT_1);

    const { granted, candidates } = await listAccess(healthCase.id);

    // Department 1 case workers except Magnus (assigned): Tine, Sofie, Henrik, Nora.
    expect(granted).toEqual([]);
    expect(candidates.map((u) => u.firstName).sort()).toEqual(['Henrik', 'Nora', 'Sofie', 'Tine']);
  });

  it('gives read access, logged with the case worker’s id', async () => {
    storeCases(healthCase);
    const leader = actAs(INGRID_LEADER_DEPT_1);

    const { granted, candidates } = await grant(healthCase.id, sofie.id);

    expect(granted.map((u) => u.id)).toEqual([sofie.id]);
    expect(candidates.map((u) => u.id)).not.toContain(sofie.id);
    expect(readDb().cases[0]?.readAccess).toEqual([sofie.id]);
    expect(readDb().auditLog).toMatchObject([
      {
        userId: leader.id,
        action: 'ReadAccessGranted',
        result: 'Success',
        caseId: healthCase.id,
        details: { caseWorkerId: sofie.id },
      },
    ]);
  });

  it('lets the case worker see and open the case, read-only', async () => {
    storeCases(healthCase);
    actAs(INGRID_LEADER_DEPT_1);
    await grant(healthCase.id, sofie.id);
    actAs(SOFIE);

    const overview = await apiRequest('/api/cases', { schema: z.array(overviewRowSchema) });
    const opened = await apiRequest(`/api/cases/${healthCase.id}`, { schema: caseResponseSchema });

    expect(overview.map((row) => row.caseNumber)).toEqual(['2026/0040']);
    expect(opened.access).toBe('full');
    await expect(
      apiRequest(`/api/cases/${healthCase.id}/field`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ field: 'Social' }),
      }),
    ).rejects.toEqual(new ApiError(403, `/api/cases/${healthCase.id}/field`));
  });

  it('removes read access, after which the case is gone for the case worker', async () => {
    storeCases({ ...healthCase, readAccess: [sofie.id] });
    actAs(INGRID_LEADER_DEPT_1);

    const { granted } = await revoke(healthCase.id, sofie.id);

    expect(granted).toEqual([]);
    expect(readDb().auditLog[0]).toMatchObject({
      action: 'ReadAccessRemoved',
      details: { caseWorkerId: sofie.id },
    });
    actAs(SOFIE);
    await expect(
      apiRequest(`/api/cases/${healthCase.id}`, { schema: caseResponseSchema }),
    ).rejects.toEqual(new ApiError(403, `/api/cases/${healthCase.id}`));
  });

  it.each([
    ['the assigned case worker', () => magnus.id],
    ['a case worker in another department', () => emil.id],
    ['a leader', () => seedUser(INGRID_LEADER_DEPT_1).id],
    ['an unknown user', () => crypto.randomUUID()],
  ])('rejects giving read access to %s with 400', async (_label, id) => {
    storeCases(healthCase);
    actAs(INGRID_LEADER_DEPT_1);

    await expect(grant(healthCase.id, id())).rejects.toEqual(
      new ApiError(400, `/api/cases/${healthCase.id}/read-access`),
    );
    expect(readDb().cases[0]?.readAccess).toEqual([]);
  });

  it('rejects an inactive case worker and removing access nobody has', async () => {
    storeCases(healthCase);
    const db = readDb();
    writeDb({
      ...db,
      users: db.users.map((u) => (u.id === sofie.id ? { ...u, isActive: false } : u)),
    });
    actAs(INGRID_LEADER_DEPT_1);

    await expect(grant(healthCase.id, sofie.id)).rejects.toBeInstanceOf(ApiError);
    await expect(revoke(healthCase.id, sofie.id)).rejects.toEqual(
      new ApiError(400, `/api/cases/${healthCase.id}/read-access/${sofie.id}`),
    );
  });

  it.each([
    ['a case worker', TINE_CASE_WORKER_DEPT_1, () => healthCase],
    ['an admin', LARS_ADMIN, () => healthCase],
    ['a leader of another department', KARI_LEADER_DEPT_2, () => healthCase],
    [
      'the leader, on a closed case',
      INGRID_LEADER_DEPT_1,
      () => ({ ...healthCase, status: 'Closed' as const }),
    ],
  ])('refuses %s with 403 and logs Denied', async (_label, email, make) => {
    const target = make();
    storeCases(target);
    const user = actAs(email);

    await expect(listAccess(target.id)).rejects.toEqual(
      new ApiError(403, `/api/cases/${target.id}/read-access`),
    );
    await expect(grant(target.id, sofie.id)).rejects.toEqual(
      new ApiError(403, `/api/cases/${target.id}/read-access`),
    );
    expect(readDb().cases[0]?.readAccess).toEqual([]);
    expect(readDb().auditLog).toMatchObject([
      {
        userId: user.id,
        action: 'ReadAccessGranted',
        result: 'Denied',
        details: { caseWorkerId: sofie.id },
      },
    ]);
  });
});
