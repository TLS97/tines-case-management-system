import type { DepartmentId, Field, Role, User } from '@/features/auth';

// Seed users from SPEC.md "Seed data". All fake; emails use example.com. Ids are fixed so tests
// and bookmarks stay stable across resets.

const SEEDED_AT = '2026-09-01T08:00:00.000Z';

function seedUser(
  id: string,
  firstName: string,
  surname: string,
  email: string,
  role: Role,
  departmentId: DepartmentId,
  primaryField: Field,
  fields: Field[],
): User {
  return {
    id,
    firstName,
    surname,
    email,
    isActive: true,
    createdAt: SEEDED_AT,
    updatedAt: null,
    departmentId,
    role,
    primaryField,
    fields,
  };
}

/** The user the app starts as (SPEC.md: default user). */
export const DEFAULT_USER_ID = '94856e69-dc05-462d-80f6-8f1be92911cd';

// One row per user, like the table in SPEC.md.
// prettier-ignore
export const SEED_USERS: readonly User[] = [
  // Department 1: Department of Supervision
  seedUser('8437630c-b86f-4297-a5ea-8e3ffade04cf', 'Ingrid', 'Halvorsen', 'ingrid.halvorsen@example.com', 'Leader', 1, 'Health', ['Health', 'Social']),
  seedUser(DEFAULT_USER_ID, 'Tine', 'Tester', 'tine.tester@example.com', 'CaseWorker', 1, 'Health', ['Health']),
  seedUser('1f166c34-2e8c-4b53-97ca-b1dd4f9e787c', 'Magnus', 'Berg', 'magnus.berg@example.com', 'CaseWorker', 1, 'Health', ['Health', 'Social']),
  seedUser('c674259b-e949-4b1d-8003-4256d1432899', 'Sofie', 'Lunde', 'sofie.lunde@example.com', 'CaseWorker', 1, 'Social', ['Social']),
  seedUser('fcaaf2be-ba3a-4ddc-9db9-7e0ee1c2b307', 'Henrik', 'Aasen', 'henrik.aasen@example.com', 'CaseWorker', 1, 'Health', ['Health']),
  seedUser('9dd2c286-396c-432f-99d0-300e68ef2621', 'Nora', 'Strand', 'nora.strand@example.com', 'CaseWorker', 1, 'Social', ['Social', 'Health']),
  // Department 2: Department of Child Welfare
  seedUser('5664c196-f17b-4215-b3db-c614e6b85368', 'Kari', 'Solberg', 'kari.solberg@example.com', 'Leader', 2, 'ChildServices', ['ChildServices', 'Social']),
  seedUser('aa39ae1c-faf9-4964-828a-f755d2ec4a13', 'Emil', 'Haugen', 'emil.haugen@example.com', 'CaseWorker', 2, 'ChildServices', ['ChildServices']),
  seedUser('81cddbe6-54eb-45d2-8957-fd64e64bdc86', 'Ida', 'Moen', 'ida.moen@example.com', 'CaseWorker', 2, 'ChildServices', ['ChildServices', 'Social']),
  seedUser('7b10df37-1e06-474e-af7e-b7b7d1708317', 'Jonas', 'Eide', 'jonas.eide@example.com', 'CaseWorker', 2, 'Social', ['Social']),
  seedUser('7a63f9a1-d11a-47df-a23a-45ff18dd8b9f', 'Thea', 'Bakken', 'thea.bakken@example.com', 'CaseWorker', 2, 'ChildServices', ['ChildServices']),
  seedUser('ced0acbe-ae0e-4d6f-b5ab-f4c1098280a2', 'Sander', 'Lie', 'sander.lie@example.com', 'CaseWorker', 2, 'Social', ['Social', 'ChildServices']),
  // Department 3: Department of Business Management
  seedUser('4dc37ead-cc44-40ba-93a1-8079ba27d78e', 'Erik', 'Nygård', 'erik.nygard@example.com', 'Leader', 3, 'Health', ['Health', 'Social', 'ChildServices']),
  seedUser('e18d4ef5-392e-422b-84bf-11eb11590201', 'Maja', 'Dahl', 'maja.dahl@example.com', 'CaseWorker', 3, 'Health', ['Health']),
  seedUser('2c74ae21-0edb-4493-ae0f-24620bb3c696', 'Andreas', 'Holm', 'andreas.holm@example.com', 'CaseWorker', 3, 'Social', ['Social']),
  seedUser('c14b6e14-618d-475a-8af0-3138b6178f28', 'Emma', 'Vik', 'emma.vik@example.com', 'CaseWorker', 3, 'ChildServices', ['ChildServices']),
  seedUser('d8154f27-c66d-4418-b6d9-21d13600c492', 'Oskar', 'Ruud', 'oskar.ruud@example.com', 'CaseWorker', 3, 'Health', ['Health', 'ChildServices']),
  seedUser('fc7b3e9a-b961-41d2-aa82-72753b2fbe2e', 'Hanna', 'Sæther', 'hanna.saether@example.com', 'CaseWorker', 3, 'Social', ['Social', 'Health']),
  // Admin
  seedUser('3846a4ad-2ad7-4fdd-a5f2-26268b46dec0', 'Lars', 'Johansen', 'lars.johansen@example.com', 'Admin', 1, 'Health', ['Health']),
];
