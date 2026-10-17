import { z } from 'zod';
import { auditEntrySchema } from '@/features/audit-log';
import { userSchema } from '@/features/auth';
import { DEFAULT_USER_ID, SEED_USERS } from './seed/users';

// The mock API's data, saved in localStorage so it survives a reload (decision 0002).
// Later tasks add cases and the audit log as new collections and bump the version.

export const MOCK_DB_STORAGE_KEY = 'sak.mockDb';

const mockDbSchema = z
  .object({
    version: z.literal(3),
    users: z.array(userSchema),
    // The user the app acts as; changed with the user switcher (mock only).
    currentUserId: z.uuid(),
    // F-005: oldest first. Written with recordAudit (mocks/auditLog.ts).
    auditLog: z.array(auditEntrySchema),
  })
  .refine((db) => db.users.some((user) => user.id === db.currentUserId), {
    message: 'currentUserId must belong to a user',
    path: ['currentUserId'],
  });

export type MockDb = z.infer<typeof mockDbSchema>;

function createSeedDb(): MockDb {
  return {
    version: 3,
    users: structuredClone([...SEED_USERS]),
    currentUserId: DEFAULT_USER_ID,
    auditLog: [],
  };
}

export function writeDb(db: MockDb): void {
  localStorage.setItem(MOCK_DB_STORAGE_KEY, JSON.stringify(db));
}

/** Clears all mock data and loads the seed data again. */
export function resetDb(): MockDb {
  const db = createSeedDb();
  writeDb(db);
  return db;
}

/**
 * Reads the mock data. Loads the seed data when localStorage is empty, and also when the stored
 * data no longer matches the schema (for example after a version change), so the app never
 * runs on broken data.
 */
export function readDb(): MockDb {
  const stored = localStorage.getItem(MOCK_DB_STORAGE_KEY);
  if (stored === null) return resetDb();

  const result = mockDbSchema.safeParse(parseJson(stored));
  return result.success ? result.data : resetDb();
}

function parseJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return undefined;
  }
}
