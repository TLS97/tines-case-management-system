import { describe, expect, it } from 'vitest';
import { auditLogResponseSchema, type AuditEntry } from '@/features/audit-log';
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

// F-005: reading the audit log, per case (Leader, T3.7) and as a whole with filters (Admin, T3.8).

const ingrid = seedUser(INGRID_LEADER_DEPT_1);
const lars = seedUser(LARS_ADMIN);
const nora = seedUser('nora.strand@example.com');
const caseInDept1 = makeCase({ caseNumber: '2026/0001', departmentId: 1 });
const caseInDept2 = makeCase({ caseNumber: '2026/0002', departmentId: 2 });

/** A local time on 17–19 October 2026, so the date filters work in any time zone. */
const at = (day: number, hour = 12) => new Date(2026, 9, day, hour).toISOString();

function entry(fields: Partial<AuditEntry> & Pick<AuditEntry, 'action'>): AuditEntry {
  return {
    id: crypto.randomUUID(),
    timestamp: at(17),
    userId: ingrid.id,
    result: 'Success',
    details: {},
    ...fields,
  };
}

const created = entry({ action: 'CaseCreated', caseId: caseInDept1.id, timestamp: at(17, 9) });
const assigned = entry({
  action: 'CaseAssigned',
  caseId: caseInDept1.id,
  timestamp: at(18),
  details: { previousCaseWorkerId: null, newCaseWorkerId: nora.id },
});
const deniedOpen = entry({
  action: 'CaseOpened',
  caseId: caseInDept2.id,
  result: 'Denied',
  timestamp: at(18, 23),
});
const userAdded = entry({
  action: 'UserAdded',
  userId: lars.id,
  timestamp: at(19, 0),
  details: { addedUserId: nora.id },
});

function storeLog(...entries: AuditEntry[]) {
  storeCases(caseInDept1, caseInDept2);
  writeDb({ ...readDb(), auditLog: entries });
}

const caseLog = (caseId: string) =>
  apiRequest(`/api/cases/${caseId}/audit-log`, { schema: auditLogResponseSchema });
const globalLog = (search = '') =>
  apiRequest(`/api/audit-log${search && `?${search}`}`, { schema: auditLogResponseSchema });

describe('F-005 GET /api/cases/:id/audit-log (T3.7)', () => {
  it('gives a leader the case’s entries newest first, with the names they refer to', async () => {
    storeLog(created, assigned, deniedOpen, userAdded);
    actAs(INGRID_LEADER_DEPT_1);

    const log = await caseLog(caseInDept1.id);

    expect(log.entries.map((e) => e.id)).toEqual([assigned.id, created.id]);
    expect(log.users.map((u) => u.firstName).sort()).toEqual(['Ingrid', 'Nora']);
    expect(log.cases).toEqual([{ id: caseInDept1.id, caseNumber: '2026/0001' }]);
  });

  it('is not itself logged', async () => {
    storeLog(created);
    actAs(INGRID_LEADER_DEPT_1);

    await caseLog(caseInDept1.id);

    expect(readDb().auditLog).toEqual([created]);
  });

  it.each([
    ['a leader of another department', KARI_LEADER_DEPT_2],
    ['a case worker', TINE_CASE_WORKER_DEPT_1],
    ['Admin (who uses the global log)', LARS_ADMIN],
  ])('refuses %s with 403', async (_label, email) => {
    storeLog(created);
    actAs(email);

    await expect(caseLog(caseInDept1.id)).rejects.toEqual(
      new ApiError(403, `/api/cases/${caseInDept1.id}/audit-log`),
    );
  });

  it('answers 404 for a case that does not exist', async () => {
    actAs(INGRID_LEADER_DEPT_1);
    const id = crypto.randomUUID();

    await expect(caseLog(id)).rejects.toEqual(new ApiError(404, `/api/cases/${id}/audit-log`));
  });
});

describe('F-005 GET /api/audit-log (T3.8)', () => {
  it('gives Admin every entry newest first, with user names and case numbers', async () => {
    storeLog(created, assigned, deniedOpen, userAdded);
    actAs(LARS_ADMIN);

    const log = await globalLog();

    expect(log.entries.map((e) => e.id)).toEqual([
      userAdded.id,
      deniedOpen.id,
      assigned.id,
      created.id,
    ]);
    expect(log.users.map((u) => u.firstName).sort()).toEqual(['Ingrid', 'Lars', 'Nora']);
    expect(log.cases.map((c) => c.caseNumber).sort()).toEqual(['2026/0001', '2026/0002']);
    expect(readDb().auditLog).toHaveLength(4);
  });

  it.each([
    ['case id', () => `case=${caseInDept2.id}`, () => [deniedOpen]],
    ['case number', () => 'case=2026%2F0001', () => [assigned, created]],
    ['a case number that does not exist', () => 'case=2026%2F0099', () => []],
    ['action', () => 'action=UserAdded', () => [userAdded]],
    ['user', () => `userId=${lars.id}`, () => [userAdded]],
    ['result', () => 'result=Denied', () => [deniedOpen]],
    ['from date', () => 'from=2026-10-18', () => [userAdded, deniedOpen, assigned]],
    ['to date (the whole day)', () => 'to=2026-10-18', () => [deniedOpen, assigned, created]],
    ['one day', () => 'from=2026-10-18&to=2026-10-18', () => [deniedOpen, assigned]],
    ['combined filters', () => 'case=2026%2F0001&from=2026-10-18', () => [assigned]],
    [
      'an invalid value (ignored)',
      () => 'action=Deleted',
      () => [userAdded, deniedOpen, assigned, created],
    ],
  ])('filters by %s', async (_label, search, expected) => {
    storeLog(created, assigned, deniedOpen, userAdded);
    actAs(LARS_ADMIN);

    const log = await globalLog(search());

    expect(log.entries.map((e) => e.id)).toEqual(expected().map((e) => e.id));
  });

  it.each([
    ['a leader', INGRID_LEADER_DEPT_1],
    ['a case worker', TINE_CASE_WORKER_DEPT_1],
  ])('refuses %s with 403', async (_label, email) => {
    storeLog(created);
    actAs(email);

    await expect(globalLog()).rejects.toEqual(new ApiError(403, '/api/audit-log'));
  });
});
