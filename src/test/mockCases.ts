import type { SupervisionCase } from '@/features/cases';
import { readDb, writeDb } from '@/mocks/db';

/** Adds cases to the mock data, as if they had been created and edited through the app. */
export function storeCases(...cases: SupervisionCase[]): void {
  const db = readDb();
  writeDb({ ...db, cases: [...db.cases, ...cases] });
}
