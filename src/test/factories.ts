import { userSchema, type User } from '@/features/auth';
import {
  healthPersonnelSchema,
  supervisionCaseSchema,
  companySchema,
  type Company,
  type HealthPersonnel,
  type SupervisionCase,
} from '@/features/cases';

// Test data factories: valid, clearly fake defaults that a test overrides where it matters.
// Every result is checked against the schema, so a test cannot build data the app would reject.

export function makeUser(overrides: Partial<User> = {}): User {
  return userSchema.parse({
    id: crypto.randomUUID(),
    firstName: 'Test',
    surname: 'User',
    email: 'test.user@example.com',
    isActive: true,
    createdAt: '2026-09-01T08:00:00.000Z',
    updatedAt: null,
    departmentId: 1,
    role: 'CaseWorker',
    primaryField: 'Health',
    fields: ['Health'],
    ...overrides,
  });
}

export function makeCase(overrides: Partial<SupervisionCase> = {}): SupervisionCase {
  return supervisionCaseSchema.parse({
    id: crypto.randomUUID(),
    caseNumber: '2026/0001',
    status: 'Unassigned',
    field: 'Health',
    departmentId: 1,
    assignedTo: null,
    readAccess: [],
    healthPersonnel: [],
    companies: [],
    ...overrides,
  });
}

export function makeHealthPersonnel(overrides: Partial<HealthPersonnel> = {}): HealthPersonnel {
  return healthPersonnelSchema.parse({
    id: crypto.randomUUID(),
    healthPersonnelNumber: '9000001',
    firstName: 'Test',
    surname: 'Person',
    authorizations: [{ validFromDate: '2020-01-01', validToDate: null, description: 'Nurse' }],
    ...overrides,
  });
}

export function makeCompany(overrides: Partial<Company> = {}): Company {
  return companySchema.parse({
    id: crypto.randomUUID(),
    organizationNumber: '900000001',
    name: 'Test Clinic',
    description: 'Fake company for tests',
    address: {
      streetName: 'Test Street 1',
      zipCode: '0001',
      state: 'Test State',
      country: 'Norway',
    },
    ...overrides,
  });
}
