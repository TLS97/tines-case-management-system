import { afterEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import {
  caseResponseSchema,
  caseWorkerSummarySchema,
  supervisionCaseSchema,
} from '@/features/cases';
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
import { readDb, writeDb } from '../db';

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

describe('F-002 GET /api/cases/:id', () => {
  function getCase(id: string) {
    return apiRequest(`/api/cases/${id}`, { schema: caseResponseSchema });
  }

  const tine = seedUser(TINE_CASE_WORKER_DEPT_1);
  const caseInDepartment1 = makeCase({
    departmentId: 1,
    status: 'InProgress',
    assignedTo: tine.id,
    healthPersonnel: [makeHealthPersonnel()],
    companies: [makeCompany()],
  });

  it.each([
    ['the assigned case worker', TINE_CASE_WORKER_DEPT_1],
    ['the leader of the department', INGRID_LEADER_DEPT_1],
  ])('gives %s the full case and the case worker’s name', async (_label, email) => {
    storeCases(caseInDepartment1);
    actAs(email);

    const response = await getCase(caseInDepartment1.id);

    expect(response).toEqual({
      access: 'full',
      supervisionCase: caseInDepartment1,
      assignedCaseWorker: {
        id: tine.id,
        firstName: 'Tine',
        surname: 'Tester',
        isActive: true,
        departmentId: 1,
      },
    });
  });

  it('gives Admin the restricted view, without health personnel or companies', async () => {
    storeCases(caseInDepartment1);
    actAs(LARS_ADMIN);

    const response = await getCase(caseInDepartment1.id);

    expect(response.access).toBe('restricted');
    expect(response.supervisionCase).not.toHaveProperty('healthPersonnel');
    expect(response.supervisionCase).not.toHaveProperty('companies');
    expect(response.assignedCaseWorker?.surname).toBe('Tester');
  });

  it('logs "case opened" with Success and which view was given', async () => {
    storeCases(caseInDepartment1);
    const admin = actAs(LARS_ADMIN);

    await getCase(caseInDepartment1.id);

    expect(readDb().auditLog).toMatchObject([
      {
        userId: admin.id,
        action: 'CaseOpened',
        caseId: caseInDepartment1.id,
        result: 'Success',
        details: { view: 'restricted' },
      },
    ]);
  });

  it.each([
    ['a case worker who is not assigned', 'magnus.berg@example.com'],
    ['a leader of another department', KARI_LEADER_DEPT_2],
  ])('refuses %s with 403 and logs Denied', async (_label, email) => {
    storeCases(caseInDepartment1);
    const user = actAs(email);

    await expect(getCase(caseInDepartment1.id)).rejects.toEqual(
      new ApiError(403, `/api/cases/${caseInDepartment1.id}`),
    );
    expect(readDb().auditLog).toMatchObject([
      { userId: user.id, action: 'CaseOpened', caseId: caseInDepartment1.id, result: 'Denied' },
    ]);
  });

  it('answers 404 for a case that does not exist', async () => {
    const id = crypto.randomUUID();

    await expect(getCase(id)).rejects.toEqual(new ApiError(404, `/api/cases/${id}`));
  });

  it('shows a deactivated case worker as inactive', async () => {
    storeCases(caseInDepartment1);
    const db = readDb();
    writeDb({
      ...db,
      users: db.users.map((user) => (user.id === tine.id ? { ...user, isActive: false } : user)),
    });
    actAs(INGRID_LEADER_DEPT_1);

    const response = await getCase(caseInDepartment1.id);

    expect(response.assignedCaseWorker?.isActive).toBe(false);
  });
});

describe('F-004 assigning a case', () => {
  const ingrid = seedUser(INGRID_LEADER_DEPT_1);
  const magnus = seedUser('magnus.berg@example.com'); // CaseWorker, dept 1, Health + Social
  const sofie = seedUser('sofie.lunde@example.com'); // CaseWorker, dept 1, Social only
  const emil = seedUser('emil.haugen@example.com'); // CaseWorker, dept 2, Child services only
  const maja = seedUser('maja.dahl@example.com'); // CaseWorker, dept 3, Health
  const tine = seedUser(TINE_CASE_WORKER_DEPT_1); // CaseWorker, dept 1, Health

  function assign(caseId: string, caseWorkerId: string) {
    return apiRequest(`/api/cases/${caseId}/assignee`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ caseWorkerId }),
      schema: caseResponseSchema,
    });
  }

  function eligibleFor(caseId: string) {
    return apiRequest(`/api/cases/${caseId}/eligible-case-workers`, {
      schema: z.array(caseWorkerSummarySchema),
    });
  }

  const unassignedHealthCase = makeCase({ departmentId: 1, field: 'Health' });

  it('lists the active case workers with the case’s field, from every department', async () => {
    storeCases(unassignedHealthCase);
    actAs(INGRID_LEADER_DEPT_1);

    const eligible = await eligibleFor(unassignedHealthCase.id);

    // Case workers with Health: Tine, Magnus, Henrik, Nora in department 1 (not Sofie: Social only),
    // and Maja, Oskar, Hanna in department 3 to borrow. Department 2 has nobody with Health.
    expect(eligible.map((u) => `${u.firstName} ${u.departmentId}`).sort()).toEqual([
      'Hanna 3',
      'Henrik 1',
      'Magnus 1',
      'Maja 3',
      'Nora 1',
      'Oskar 3',
      'Tine 1',
    ]);
  });

  it('assigns an Unassigned case: status becomes Assigned, both are logged', async () => {
    storeCases(unassignedHealthCase);
    actAs(INGRID_LEADER_DEPT_1);

    const response = await assign(unassignedHealthCase.id, magnus.id);

    expect(response.supervisionCase).toMatchObject({ assignedTo: magnus.id, status: 'Assigned' });
    expect(response.assignedCaseWorker?.firstName).toBe('Magnus');
    expect(readDb().cases[0]).toMatchObject({ assignedTo: magnus.id, status: 'Assigned' });
    expect(readDb().auditLog).toMatchObject([
      {
        userId: ingrid.id,
        action: 'CaseAssigned',
        result: 'Success',
        caseId: unassignedHealthCase.id,
        details: { previousCaseWorkerId: null, newCaseWorkerId: magnus.id },
      },
      {
        action: 'StatusChanged',
        result: 'Success',
        details: { from: 'Unassigned', to: 'Assigned' },
      },
    ]);
  });

  it('borrows a case worker from another department: logged with their home department', async () => {
    storeCases(unassignedHealthCase);
    actAs(INGRID_LEADER_DEPT_1);

    const response = await assign(unassignedHealthCase.id, maja.id);

    expect(response.supervisionCase).toMatchObject({
      assignedTo: maja.id,
      status: 'Assigned',
      departmentId: 1,
    });
    expect(response.assignedCaseWorker).toMatchObject({ firstName: 'Maja', departmentId: 3 });
    expect(readDb().auditLog[0]).toMatchObject({
      action: 'CaseAssigned',
      result: 'Success',
      details: { previousCaseWorkerId: null, newCaseWorkerId: maja.id, homeDepartmentId: 3 },
    });
  });

  it('logs no home department for a case worker from the case’s own department', async () => {
    storeCases(unassignedHealthCase);
    actAs(INGRID_LEADER_DEPT_1);

    await assign(unassignedHealthCase.id, magnus.id);

    expect(readDb().auditLog[0]?.details).not.toHaveProperty('homeDepartmentId');
  });

  it('lets a borrowed case worker work on the case, and gives them nothing else there', async () => {
    const otherCase = makeCase({ caseNumber: '2026/0050', departmentId: 1, field: 'Health' });
    storeCases(unassignedHealthCase, otherCase);
    actAs(INGRID_LEADER_DEPT_1);
    await assign(unassignedHealthCase.id, maja.id);
    actAs('maja.dahl@example.com');

    const opened = await apiRequest(`/api/cases/${unassignedHealthCase.id}`, {
      schema: caseResponseSchema,
    });
    expect(opened.access).toBe('full');
    await expect(
      apiRequest(`/api/cases/${otherCase.id}`, { schema: caseResponseSchema }),
    ).rejects.toEqual(new ApiError(403, `/api/cases/${otherCase.id}`));
  });

  it('reassigns an InProgress case without changing the status', async () => {
    const inProgress = makeCase({
      departmentId: 1,
      field: 'Health',
      status: 'InProgress',
      assignedTo: tine.id,
    });
    storeCases(inProgress);
    actAs(INGRID_LEADER_DEPT_1);

    const response = await assign(inProgress.id, magnus.id);

    expect(response.supervisionCase).toMatchObject({ assignedTo: magnus.id, status: 'InProgress' });
    expect(readDb().auditLog).toMatchObject([
      {
        action: 'CaseAssigned',
        details: { previousCaseWorkerId: tine.id, newCaseWorkerId: magnus.id },
      },
    ]);
  });

  it('can replace a deactivated case worker', async () => {
    const withDeactivated = makeCase({
      departmentId: 1,
      field: 'Health',
      status: 'InProgress',
      assignedTo: tine.id,
    });
    storeCases(withDeactivated);
    const db = readDb();
    writeDb({
      ...db,
      users: db.users.map((u) => (u.id === tine.id ? { ...u, isActive: false } : u)),
    });
    actAs(INGRID_LEADER_DEPT_1);

    const response = await assign(withDeactivated.id, magnus.id);

    expect(response.supervisionCase.assignedTo).toBe(magnus.id);
  });

  it.each([
    ['a case worker without the case’s field', () => sofie.id],
    ['a case worker in another department without the case’s field', () => emil.id],
    ['a leader', () => ingrid.id],
    ['an unknown user', () => crypto.randomUUID()],
  ])('rejects %s with 400 and changes nothing', async (_label, candidateId) => {
    storeCases(unassignedHealthCase);
    actAs(INGRID_LEADER_DEPT_1);

    await expect(assign(unassignedHealthCase.id, candidateId())).rejects.toEqual(
      new ApiError(400, `/api/cases/${unassignedHealthCase.id}/assignee`),
    );
    expect(readDb().cases[0]).toEqual(unassignedHealthCase);
  });

  it('rejects an inactive case worker with 400', async () => {
    storeCases(unassignedHealthCase);
    const db = readDb();
    writeDb({
      ...db,
      users: db.users.map((u) => (u.id === magnus.id ? { ...u, isActive: false } : u)),
    });
    actAs(INGRID_LEADER_DEPT_1);

    await expect(assign(unassignedHealthCase.id, magnus.id)).rejects.toBeInstanceOf(ApiError);
    expect(readDb().cases[0]?.assignedTo).toBeNull();
  });

  it('rejects assigning to the case worker who already has the case', async () => {
    const assigned = makeCase({ departmentId: 1, status: 'Assigned', assignedTo: magnus.id });
    storeCases(assigned);
    actAs(INGRID_LEADER_DEPT_1);

    await expect(assign(assigned.id, magnus.id)).rejects.toEqual(
      new ApiError(400, `/api/cases/${assigned.id}/assignee`),
    );
  });

  it.each([
    ['a case worker', TINE_CASE_WORKER_DEPT_1, () => unassignedHealthCase],
    ['an admin', LARS_ADMIN, () => unassignedHealthCase],
    ['a leader of another department', KARI_LEADER_DEPT_2, () => unassignedHealthCase],
    [
      'a leader, for a closed case',
      INGRID_LEADER_DEPT_1,
      () => makeCase({ departmentId: 1, status: 'Closed', assignedTo: tine.id }),
    ],
  ])('refuses %s with 403 and logs Denied', async (_label, email, makeTarget) => {
    const target = makeTarget();
    storeCases(target);
    const user = actAs(email);

    await expect(assign(target.id, magnus.id)).rejects.toEqual(
      new ApiError(403, `/api/cases/${target.id}/assignee`),
    );
    await expect(eligibleFor(target.id)).rejects.toEqual(
      new ApiError(403, `/api/cases/${target.id}/eligible-case-workers`),
    );
    expect(readDb().cases[0]).toEqual(target);
    expect(readDb().auditLog).toMatchObject([
      { userId: user.id, action: 'CaseAssigned', result: 'Denied', caseId: target.id },
    ]);
  });

  it('answers 404 for a case that does not exist', async () => {
    actAs(INGRID_LEADER_DEPT_1);
    const id = crypto.randomUUID();

    await expect(assign(id, magnus.id)).rejects.toEqual(
      new ApiError(404, `/api/cases/${id}/assignee`),
    );
  });
});
