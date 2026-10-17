import { describe, expect, it } from 'vitest';
import { caseResponseSchema } from '@/features/cases';
import { ApiError, apiRequest } from '@/shared/api/apiRequest';
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

// F-002: close (assigned case worker, every party has a reaction). F-004: reopen (leader).

const MAGNUS = 'magnus.berg@example.com';
const magnus = seedUser(MAGNUS);

const close = (id: string) =>
  apiRequest(`/api/cases/${id}/close`, { method: 'POST', schema: caseResponseSchema });
const reopen = (id: string) =>
  apiRequest(`/api/cases/${id}/reopen`, { method: 'POST', schema: caseResponseSchema });

function readyCase(overrides = {}) {
  return makeCase({
    departmentId: 1,
    status: 'InProgress',
    assignedTo: magnus.id,
    healthPersonnel: [makeHealthPersonnel({ reaction: 'Prohibition' })],
    companies: [makeCompany({ reaction: 'NoReaction' })],
    ...overrides,
  });
}

describe('F-002 POST /api/cases/:id/close', () => {
  it('closes a ready case and logs "status changed"', async () => {
    const target = readyCase();
    storeCases(target);
    actAs(MAGNUS);

    const response = await close(target.id);

    expect(response.supervisionCase.status).toBe('Closed');
    expect(readDb().cases[0]?.status).toBe('Closed');
    expect(readDb().auditLog).toMatchObject([
      {
        userId: magnus.id,
        action: 'StatusChanged',
        result: 'Success',
        details: { from: 'InProgress', to: 'Closed' },
      },
    ]);
  });

  it.each([
    ['without any parties', { healthPersonnel: [], companies: [] }],
    ['with a health personnel without a reaction', { healthPersonnel: [makeHealthPersonnel()] }],
    ['with a company without a reaction', { companies: [makeCompany()] }],
  ])('refuses a case %s with 409 and changes nothing', async (_label, overrides) => {
    const target = readyCase(overrides);
    storeCases(target);
    actAs(MAGNUS);

    await expect(close(target.id)).rejects.toEqual(
      new ApiError(409, `/api/cases/${target.id}/close`),
    );
    expect(readDb().cases[0]?.status).toBe('InProgress');
  });

  it.each([
    ['another case worker', TINE_CASE_WORKER_DEPT_1, () => readyCase()],
    ['the leader', INGRID_LEADER_DEPT_1, () => readyCase()],
    ['an admin', LARS_ADMIN, () => readyCase()],
    ['the case worker, for an Assigned case', MAGNUS, () => readyCase({ status: 'Assigned' })],
    [
      'the case worker, for a case that is already closed',
      MAGNUS,
      () => readyCase({ status: 'Closed' }),
    ],
  ])('refuses %s with 403 and logs Denied', async (_label, email, make) => {
    const target = make();
    storeCases(target);
    const user = actAs(email);

    await expect(close(target.id)).rejects.toEqual(
      new ApiError(403, `/api/cases/${target.id}/close`),
    );
    expect(readDb().cases[0]).toEqual(target);
    expect(readDb().auditLog).toMatchObject([
      { userId: user.id, action: 'StatusChanged', result: 'Denied', details: { to: 'Closed' } },
    ]);
  });
});

describe('F-004 POST /api/cases/:id/reopen', () => {
  it('lets the leader reopen a closed case: it becomes In progress', async () => {
    const target = readyCase({ status: 'Closed' });
    storeCases(target);
    const leader = actAs(INGRID_LEADER_DEPT_1);

    const response = await reopen(target.id);

    expect(response.supervisionCase.status).toBe('InProgress');
    expect(readDb().auditLog).toMatchObject([
      {
        userId: leader.id,
        action: 'StatusChanged',
        result: 'Success',
        details: { from: 'Closed', to: 'InProgress' },
      },
    ]);
  });

  it.each([
    ['the case worker', MAGNUS, () => readyCase({ status: 'Closed' })],
    ['a leader of another department', KARI_LEADER_DEPT_2, () => readyCase({ status: 'Closed' })],
    ['an admin', LARS_ADMIN, () => readyCase({ status: 'Closed' })],
    ['the leader, for a case that is not closed', INGRID_LEADER_DEPT_1, () => readyCase()],
  ])('refuses %s with 403 and logs Denied', async (_label, email, make) => {
    const target = make();
    storeCases(target);
    actAs(email);

    await expect(reopen(target.id)).rejects.toEqual(
      new ApiError(403, `/api/cases/${target.id}/reopen`),
    );
    expect(readDb().cases[0]).toEqual(target);
    expect(readDb().auditLog[0]).toMatchObject({ action: 'StatusChanged', result: 'Denied' });
  });

  it('answers 404 for a case that does not exist', async () => {
    actAs(INGRID_LEADER_DEPT_1);
    const id = crypto.randomUUID();

    await expect(reopen(id)).rejects.toEqual(new ApiError(404, `/api/cases/${id}/reopen`));
  });
});
