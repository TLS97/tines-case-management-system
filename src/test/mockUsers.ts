import type { User } from '@/features/auth';
import { readDb, writeDb } from '@/mocks/db';
import { SEED_USERS } from '@/mocks/seed/users';

/** A seed user from SPEC.md, found by email. */
export function seedUser(email: string): User {
  const user = SEED_USERS.find((candidate) => candidate.email === email);
  if (!user) throw new Error(`No seed user with email ${email}`);
  return user;
}

/** Makes the mock API act as this seed user, like the user switcher does. Returns the user. */
export function actAs(email: string): User {
  const user = seedUser(email);
  writeDb({ ...readDb(), currentUserId: user.id });
  return user;
}

// Seed users used across tests (SPEC.md "Seed data").
export const INGRID_LEADER_DEPT_1 = 'ingrid.halvorsen@example.com'; // Health, Social
export const KARI_LEADER_DEPT_2 = 'kari.solberg@example.com'; // ChildServices, Social
export const TINE_CASE_WORKER_DEPT_1 = 'tine.tester@example.com';
export const LARS_ADMIN = 'lars.johansen@example.com';
