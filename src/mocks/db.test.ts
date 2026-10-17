import { describe, expect, it } from 'vitest';
import { DEPARTMENT_IDS, userSchema } from '@/features/auth';
import { MOCK_DB_STORAGE_KEY, readDb, resetDb, writeDb } from './db';
import { DEFAULT_USER_ID, SEED_USERS } from './seed/users';

function storedDb(): unknown {
  return JSON.parse(localStorage.getItem(MOCK_DB_STORAGE_KEY) ?? 'null');
}

describe('mock database', () => {
  it('loads the seed data into localStorage when it is empty', () => {
    const db = readDb();

    expect(db.users).toHaveLength(19);
    expect(storedDb()).toEqual(db);
  });

  it('keeps changes in localStorage, so they survive a reload', () => {
    const db = readDb();
    const [first] = db.users;
    if (!first) throw new Error('seed data is empty');
    writeDb({ ...db, users: [{ ...first, surname: 'Changed' }, ...db.users.slice(1)] });

    expect(readDb().users[0]?.surname).toBe('Changed');
  });

  it('loads the seed data again when the stored data is not valid JSON', () => {
    localStorage.setItem(MOCK_DB_STORAGE_KEY, '{not json');

    expect(readDb().users).toHaveLength(19);
  });

  it('loads the seed data again when the stored data does not match the schema', () => {
    localStorage.setItem(MOCK_DB_STORAGE_KEY, JSON.stringify({ version: 1, users: [{ id: 'x' }] }));

    expect(readDb().users).toHaveLength(19);
    expect(storedDb()).toMatchObject({ version: 1 });
  });

  it('resetDb replaces all changes with the seed data', () => {
    writeDb({ version: 1, users: [] });

    resetDb();

    expect(readDb().users).toEqual(SEED_USERS);
  });
});

describe('seed users (SPEC.md "Seed data")', () => {
  it('are valid users with unique ids and emails on example.com', () => {
    for (const user of SEED_USERS) expect(userSchema.safeParse(user).success).toBe(true);
    expect(new Set(SEED_USERS.map((u) => u.id)).size).toBe(SEED_USERS.length);
    expect(new Set(SEED_USERS.map((u) => u.email)).size).toBe(SEED_USERS.length);
    expect(SEED_USERS.every((u) => u.email.endsWith('@example.com'))).toBe(true);
  });

  it('have one leader and five case workers per department, and one admin', () => {
    for (const departmentId of DEPARTMENT_IDS) {
      const inDepartment = SEED_USERS.filter((u) => u.departmentId === departmentId);
      expect(inDepartment.filter((u) => u.role === 'Leader')).toHaveLength(1);
      expect(inDepartment.filter((u) => u.role === 'CaseWorker')).toHaveLength(5);
    }
    expect(SEED_USERS.filter((u) => u.role === 'Admin')).toHaveLength(1);
  });

  it('start as Tine Tester, a case worker in the Department of Supervision', () => {
    expect(SEED_USERS.find((u) => u.id === DEFAULT_USER_ID)).toMatchObject({
      firstName: 'Tine',
      surname: 'Tester',
      role: 'CaseWorker',
      departmentId: 1,
      primaryField: 'Health',
    });
  });
});
