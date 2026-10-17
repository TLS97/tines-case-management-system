import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { makeCase, makeCompany, makeHealthPersonnel } from '@/test/factories';
import { recordAudit, SensitiveAuditDataError } from './auditLog';
import { readDb, resetDb, writeDb } from './db';
import { DEFAULT_USER_ID } from './seed/users';

// F-005: writing audit entries in the mock API (SPEC.md "F-005 Audit log").

const NOW = new Date('2026-10-17T12:00:00.000Z');

const person = makeHealthPersonnel({
  healthPersonnelNumber: '9876543',
  firstName: 'Sensitivefirst',
  surname: 'Sensitivelast',
  authorizations: [
    { validFromDate: '2019-03-04', validToDate: null, description: 'Secret authorization text' },
  ],
  reaction: 'Prohibition',
});
const company = makeCompany({
  organizationNumber: '987654321',
  name: 'Sensitive Clinic',
  address: { streetName: 'Hidden Street 7', zipCode: '9876', state: 'Hidden', country: 'Norway' },
  reaction: 'SelfAssessment',
});
const supervisionCase = makeCase({
  caseNumber: '2026/0042',
  status: 'InProgress',
  healthPersonnel: [person],
  companies: [company],
});

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(NOW);
});

afterEach(() => {
  vi.useRealTimers();
});

describe('recordAudit', () => {
  it('appends an entry with id, timestamp, user, action, case, result and details', () => {
    const db = recordAudit(readDb(), {
      userId: DEFAULT_USER_ID,
      action: 'ReactionGiven',
      result: 'Success',
      supervisionCase,
      details: { healthPersonnelId: person.id },
    });

    expect(db.auditLog).toHaveLength(1);
    expect(db.auditLog[0]?.id).toMatch(/^[0-9a-f-]{36}$/);
    expect(db.auditLog).toMatchObject([
      {
        timestamp: NOW.toISOString(),
        userId: DEFAULT_USER_ID,
        action: 'ReactionGiven',
        caseId: supervisionCase.id,
        result: 'Success',
        details: { healthPersonnelId: person.id },
      },
    ]);
  });

  it('records denied actions too', () => {
    const db = recordAudit(readDb(), {
      userId: DEFAULT_USER_ID,
      action: 'CaseAssigned',
      result: 'Denied',
      supervisionCase,
    });

    expect(db.auditLog[0]).toMatchObject({ action: 'CaseAssigned', result: 'Denied', details: {} });
  });

  it('records actions without a case, such as "user added", without caseId', () => {
    const db = recordAudit(readDb(), {
      userId: DEFAULT_USER_ID,
      action: 'UserAdded',
      result: 'Success',
      details: { addedUserId: crypto.randomUUID() },
    });

    expect(db.auditLog[0]?.caseId).toBeUndefined();
  });

  it('keeps entries in order, oldest first', () => {
    let db = readDb();
    for (const action of ['CaseCreated', 'CaseAssigned', 'StatusChanged'] as const) {
      db = recordAudit(db, { userId: DEFAULT_USER_ID, action, result: 'Success', supervisionCase });
    }

    expect(db.auditLog.map((entry) => entry.action)).toEqual([
      'CaseCreated',
      'CaseAssigned',
      'StatusChanged',
    ]);
  });

  it('does not change the database it is given', () => {
    const db = readDb();

    recordAudit(db, { userId: DEFAULT_USER_ID, action: 'CaseOpened', result: 'Success' });

    expect(db.auditLog).toEqual([]);
  });

  it('allows ids, statuses and case numbers in details', () => {
    expect(() =>
      recordAudit(readDb(), {
        userId: DEFAULT_USER_ID,
        action: 'StatusChanged',
        result: 'Success',
        supervisionCase,
        details: {
          from: 'Assigned',
          to: 'InProgress',
          caseNumber: '2026/0042',
          healthPersonnelId: person.id,
        },
      }),
    ).not.toThrow();
  });
});

describe('recordAudit refuses sensitive case data in details', () => {
  it.each([
    ['health personnel number', '9876543'],
    ['health personnel number as a number', 9876543],
    ['first name', 'Sensitivefirst'],
    ['surname inside free text', 'Removed Sensitivefirst Sensitivelast from the case'],
    ['authorization description', 'Secret authorization text'],
    ['authorization date', '2019-03-04'],
    ['organization number', '987654321'],
    ['company name', 'Sensitive Clinic'],
    ['company address', 'Hidden Street 7'],
    ['health personnel reaction', 'Prohibition'],
    ['company reaction', 'SelfAssessment'],
  ])('%s', (_label, value) => {
    expect(() =>
      recordAudit(readDb(), {
        userId: DEFAULT_USER_ID,
        action: 'CaseUpdated',
        result: 'Success',
        supervisionCase,
        details: { change: value },
      }),
    ).toThrow(SensitiveAuditDataError);
  });

  it('does not repeat the sensitive value in the error message', () => {
    expect(() =>
      recordAudit(readDb(), {
        userId: DEFAULT_USER_ID,
        action: 'CaseUpdated',
        result: 'Success',
        supervisionCase,
        details: { name: 'Sensitivefirst' },
      }),
    ).toThrow('Audit details "name" contains sensitive case data');
  });

  it('refuses nested details', () => {
    expect(() =>
      recordAudit(readDb(), {
        userId: DEFAULT_USER_ID,
        action: 'CaseUpdated',
        result: 'Success',
        // @ts-expect-error details must be flat
        details: { person: { name: 'x' } },
      }),
    ).toThrow();
  });
});

describe('audit log storage', () => {
  it('starts empty', () => {
    expect(readDb().auditLog).toEqual([]);
  });

  it('is saved in localStorage, so it survives a reload', () => {
    writeDb(
      recordAudit(readDb(), { userId: DEFAULT_USER_ID, action: 'CaseOpened', result: 'Success' }),
    );

    expect(readDb().auditLog).toHaveLength(1);
  });

  it('is emptied by Reset mock data', () => {
    writeDb(
      recordAudit(readDb(), { userId: DEFAULT_USER_ID, action: 'CaseOpened', result: 'Success' }),
    );

    resetDb();

    expect(readDb().auditLog).toEqual([]);
  });
});

describe('recordAudit and the audit vocabulary', () => {
  it('allows change codes, statuses and fields even when a name appears inside them', () => {
    const named = makeCase({
      healthPersonnel: [makeHealthPersonnel({ firstName: 'Health', surname: 'Field' })],
    });

    expect(() =>
      recordAudit(readDb(), {
        userId: DEFAULT_USER_ID,
        action: 'CaseUpdated',
        result: 'Success',
        supervisionCase: named,
        details: { change: 'FieldChanged', to: 'Health', status: 'InProgress' },
      }),
    ).not.toThrow();
  });

  it('still refuses reactions, which are sensitive', () => {
    const withReaction = makeCase({
      healthPersonnel: [makeHealthPersonnel({ reaction: 'Prohibition' })],
    });

    expect(() =>
      recordAudit(readDb(), {
        userId: DEFAULT_USER_ID,
        action: 'CaseUpdated',
        result: 'Success',
        supervisionCase: withReaction,
        details: { change: 'FieldChanged', reaction: 'Prohibition' },
      }),
    ).toThrow(SensitiveAuditDataError);
  });
});
