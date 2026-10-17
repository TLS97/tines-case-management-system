import { describe, expect, it } from 'vitest';
import { makeCase, makeCompany, makeHealthPersonnel, makeUser } from '@/test/factories';
import {
  ADMIN_HIDDEN_FIELDS,
  ADMIN_VISIBLE_FIELDS,
  restrictedSupervisionCaseSchema,
  toRestrictedCase,
  viewCase,
} from './restrictedView';
import { supervisionCaseObjectSchema } from './types';

// F-004: Admin sees cases with sensitive case data left out (SPEC.md "Sensitive case data").

const caseWorker = makeUser({ role: 'CaseWorker', departmentId: 1 });

// Distinctive fake values, so the test can search the result for any trace of them.
const SENSITIVE_VALUES = [
  '9876543', // health personnel number
  'Sensitivefirstname',
  'Sensitivesurname',
  'Sensitive authorization description',
  '987654321', // organization number
  'Sensitive Clinic Name',
  'Sensitive company description',
  'Sensitive Street 99',
  '9999',
  'Sensitive State',
  'Sensitive Country',
  'Prohibition',
  'SelfAssessment',
];

const fullCase = makeCase({
  departmentId: 2,
  status: 'InProgress',
  assignedTo: caseWorker.id,
  readAccess: [crypto.randomUUID()],
  healthPersonnel: [
    makeHealthPersonnel({
      healthPersonnelNumber: '9876543',
      firstName: 'Sensitivefirstname',
      surname: 'Sensitivesurname',
      authorizations: [
        {
          validFromDate: '2020-01-01',
          validToDate: null,
          description: 'Sensitive authorization description',
        },
      ],
      reaction: 'Prohibition',
    }),
  ],
  companies: [
    makeCompany({
      organizationNumber: '987654321',
      name: 'Sensitive Clinic Name',
      description: 'Sensitive company description',
      address: {
        streetName: 'Sensitive Street 99',
        zipCode: '9999',
        state: 'Sensitive State',
        country: 'Sensitive Country',
      },
      reaction: 'SelfAssessment',
    }),
  ],
});

describe('toRestrictedCase', () => {
  it('keeps only case number, status, field, department, assigned case worker and id', () => {
    const restricted = toRestrictedCase(fullCase);

    expect(restricted).toEqual({
      id: fullCase.id,
      caseNumber: fullCase.caseNumber,
      status: 'InProgress',
      field: fullCase.field,
      departmentId: 2,
      assignedTo: caseWorker.id,
    });
  });

  it('contains no trace of health personnel, authorizations, company details or reactions', () => {
    const json = JSON.stringify(toRestrictedCase(fullCase));

    for (const value of SENSITIVE_VALUES) expect(json).not.toContain(value);
  });

  it('does not change the original case', () => {
    const before = structuredClone(fullCase);

    toRestrictedCase(fullCase);

    expect(fullCase).toEqual(before);
  });

  it('produces data that passes the strict restricted schema', () => {
    expect(restrictedSupervisionCaseSchema.safeParse(toRestrictedCase(fullCase)).success).toBe(
      true,
    );
  });
});

describe('restrictedSupervisionCaseSchema', () => {
  it.each(ADMIN_HIDDEN_FIELDS)('rejects data that still contains "%s"', (field) => {
    const leaked = { ...toRestrictedCase(fullCase), [field]: fullCase[field] };

    expect(restrictedSupervisionCaseSchema.safeParse(leaked).success).toBe(false);
  });
});

describe('Admin field lists', () => {
  it('cover every case field exactly once, so a new field needs a decision', () => {
    const allFields = Object.keys(supervisionCaseObjectSchema.shape).sort();
    const listed = [...ADMIN_VISIBLE_FIELDS, ...ADMIN_HIDDEN_FIELDS].sort();

    expect(listed).toEqual(allFields);
  });
});

describe('viewCase', () => {
  it('Admin: restricted view, in every department', () => {
    const admin = makeUser({ role: 'Admin', departmentId: 1 });

    const view = viewCase(admin, fullCase);

    expect(view).toEqual({ access: 'restricted', supervisionCase: toRestrictedCase(fullCase) });
  });

  it('Leader: full case in own department, nothing in other departments', () => {
    const ownLeader = makeUser({ role: 'Leader', departmentId: 2 });
    const otherLeader = makeUser({ role: 'Leader', departmentId: 1 });

    expect(viewCase(ownLeader, fullCase)).toEqual({ access: 'full', supervisionCase: fullCase });
    expect(viewCase(otherLeader, fullCase)).toEqual({ access: 'none' });
  });

  it('CaseWorker: full case when assigned, nothing otherwise', () => {
    const otherCaseWorker = makeUser({ role: 'CaseWorker', departmentId: 2 });

    expect(viewCase(caseWorker, fullCase)).toEqual({ access: 'full', supervisionCase: fullCase });
    expect(viewCase(otherCaseWorker, fullCase)).toEqual({ access: 'none' });
  });

  it('deactivated Admin: nothing', () => {
    const inactiveAdmin = makeUser({ role: 'Admin', isActive: false });

    expect(viewCase(inactiveAdmin, fullCase)).toEqual({ access: 'none' });
  });
});
