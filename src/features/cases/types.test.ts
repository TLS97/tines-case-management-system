import { describe, expect, it } from 'vitest';
import { makeCase, makeCompany, makeHealthPersonnel } from '@/test/factories';
import {
  authorizationSchema,
  caseNumberSchema,
  companySchema,
  healthPersonnelNumberSchema,
  healthPersonnelSchema,
  organizationNumberSchema,
  supervisionCaseSchema,
} from './types';

describe('SupervisionCase schema (SPEC.md domain model)', () => {
  it('accepts a new case: Unassigned, no case worker, no read access, no parties', () => {
    expect(supervisionCaseSchema.safeParse(makeCase()).success).toBe(true);
  });

  it.each(['2026/0042', '2026/0001', '2026/12345'])('accepts case number %s', (caseNumber) => {
    expect(caseNumberSchema.safeParse(caseNumber).success).toBe(true);
  });

  it.each(['2026/42', '26/0042', '2026-0042', '2026/00a2', ''])(
    'rejects case number "%s"',
    (caseNumber) => {
      expect(caseNumberSchema.safeParse(caseNumber).success).toBe(false);
    },
  );

  it('only allows the four statuses', () => {
    const base = makeCase();
    for (const status of ['Unassigned', 'Assigned', 'InProgress', 'Closed']) {
      expect(supervisionCaseSchema.safeParse({ ...base, status }).success).toBe(true);
    }
    expect(supervisionCaseSchema.safeParse({ ...base, status: 'Open' }).success).toBe(false);
  });

  it('rejects the same health personnel twice (same health personnel number)', () => {
    const base = makeCase();
    const first = makeHealthPersonnel({ healthPersonnelNumber: '9000001' });
    const second = makeHealthPersonnel({ healthPersonnelNumber: '9000001' });

    expect(
      supervisionCaseSchema.safeParse({ ...base, healthPersonnel: [first, second] }).success,
    ).toBe(false);
  });

  it('rejects the same company twice (same organization number)', () => {
    const base = makeCase();
    const company = makeCompany({ organizationNumber: '900000001' });

    expect(
      supervisionCaseSchema.safeParse({ ...base, companies: [company, company] }).success,
    ).toBe(false);
  });

  it('rejects giving the same user read access twice', () => {
    const userId = crypto.randomUUID();

    expect(
      supervisionCaseSchema.safeParse({ ...makeCase(), readAccess: [userId, userId] }).success,
    ).toBe(false);
  });
});

describe('HealthPersonnel schema', () => {
  it.each(['1234567', '12345678', '123456789', '0012345'])(
    'accepts health personnel number %s (7 to 9 digits)',
    (number) => {
      expect(healthPersonnelNumberSchema.safeParse(number).success).toBe(true);
    },
  );

  it.each(['123456', '1234567890', '12345 67', '1234-567', 'abcdefg', ''])(
    'rejects health personnel number "%s"',
    (number) => {
      expect(healthPersonnelNumberSchema.safeParse(number).success).toBe(false);
    },
  );

  it('needs at least one authorization', () => {
    expect(
      healthPersonnelSchema.safeParse({ ...makeHealthPersonnel(), authorizations: [] }).success,
    ).toBe(false);
  });

  it('only allows health personnel reactions', () => {
    const person = makeHealthPersonnel();
    for (const reaction of ['NoReaction', 'Prohibition', 'RestrictionOfPractice']) {
      expect(healthPersonnelSchema.safeParse({ ...person, reaction }).success).toBe(true);
    }
    expect(healthPersonnelSchema.safeParse({ ...person, reaction: 'SelfAssessment' }).success).toBe(
      false,
    );
  });

  it('has no reaction until one is given', () => {
    expect(makeHealthPersonnel().reaction).toBeUndefined();
  });
});

describe('Authorization schema', () => {
  it('accepts an authorization without validToDate (null)', () => {
    expect(
      authorizationSchema.safeParse({
        validFromDate: '2020-01-01',
        validToDate: null,
        description: '',
      }).success,
    ).toBe(true);
  });

  it('accepts validToDate on or after validFromDate', () => {
    for (const validToDate of ['2020-01-01', '2030-12-31']) {
      expect(
        authorizationSchema.safeParse({ validFromDate: '2020-01-01', validToDate, description: '' })
          .success,
      ).toBe(true);
    }
  });

  it('rejects validToDate before validFromDate', () => {
    expect(
      authorizationSchema.safeParse({
        validFromDate: '2020-01-02',
        validToDate: '2020-01-01',
        description: '',
      }).success,
    ).toBe(false);
  });

  it('needs validFromDate as a date', () => {
    expect(
      authorizationSchema.safeParse({ validFromDate: '', validToDate: null, description: '' })
        .success,
    ).toBe(false);
    expect(
      authorizationSchema.safeParse({
        validFromDate: '01.01.2020',
        validToDate: null,
        description: '',
      }).success,
    ).toBe(false);
  });
});

describe('Company schema', () => {
  it.each(['900000001', '123456789'])('accepts organization number %s', (number) => {
    expect(organizationNumberSchema.safeParse(number).success).toBe(true);
  });

  it.each(['12345678', '1234567890', '123 456 789', 'abcdefghi'])(
    'rejects organization number "%s"',
    (number) => {
      expect(organizationNumberSchema.safeParse(number).success).toBe(false);
    },
  );

  it('needs all four address fields', () => {
    const company = makeCompany();
    for (const field of ['streetName', 'zipCode', 'state', 'country'] as const) {
      const address = { ...company.address, [field]: '' };
      expect(companySchema.safeParse({ ...company, address }).success).toBe(false);
    }
  });

  it('only allows company reactions', () => {
    const company = makeCompany();
    for (const reaction of ['NoReaction', 'SelfAssessment']) {
      expect(companySchema.safeParse({ ...company, reaction }).success).toBe(true);
    }
    expect(companySchema.safeParse({ ...company, reaction: 'Prohibition' }).success).toBe(false);
  });
});
