import {
  CASE_CHANGES,
  auditEntrySchema,
  type AuditAction,
  type AuditDetails,
  type AuditEntry,
  type AuditResult,
} from '@/features/audit-log';
import { FIELDS } from '@/features/auth';
import { CASE_STATUSES, type SupervisionCase } from '@/features/cases';
import type { MockDb } from './db';

// F-005: the mock API writes an audit entry for every logged action, allowed (Success) or
// rejected (Denied). Screens to read the log come in T3.7 and T3.8.

export interface AuditInput {
  userId: string;
  action: AuditAction;
  result: AuditResult;
  /** The case the action is about, if any. Its sensitive data is checked against `details`. */
  supervisionCase?: SupervisionCase;
  details?: AuditDetails;
}

export class SensitiveAuditDataError extends Error {
  constructor(key: string) {
    // The value itself is not repeated in the message.
    super(`Audit details "${key}" contains sensitive case data`);
    this.name = 'SensitiveAuditDataError';
  }
}

/**
 * Returns the database with a new audit entry appended (it does not save it; the caller writes the
 * database once, together with its own changes). Throws if `details` repeats sensitive data from the
 * case, since audit details must never contain it (SPEC.md F-005).
 */
export function recordAudit(db: MockDb, input: AuditInput): MockDb {
  const details = input.details ?? {};
  if (input.supervisionCase) assertNoSensitiveData(details, input.supervisionCase);

  const entry: AuditEntry = auditEntrySchema.parse({
    id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
    userId: input.userId,
    action: input.action,
    caseId: input.supervisionCase?.id,
    result: input.result,
    details,
  });

  return { ...db, auditLog: [...db.auditLog, entry] };
}

/** Every value SPEC.md lists as sensitive case data: party identity, authorizations, company details, reactions. */
function sensitiveValues(supervisionCase: SupervisionCase): Set<string> {
  const values: string[] = [];
  for (const person of supervisionCase.healthPersonnel) {
    values.push(person.healthPersonnelNumber, person.firstName, person.surname);
    for (const auth of person.authorizations) {
      values.push(auth.validFromDate, auth.description);
      if (auth.validToDate) values.push(auth.validToDate);
    }
    if (person.reaction) values.push(person.reaction);
  }
  for (const company of supervisionCase.companies) {
    values.push(company.organizationNumber, company.name, company.description);
    values.push(...Object.values(company.address));
    if (company.reaction) values.push(company.reaction);
  }
  // Empty strings would match every empty detail value.
  return new Set(values.filter((value) => value.trim() !== ''));
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// The audit log's own vocabulary is never sensitive, even if a name happens to appear inside it
// (a surname "Field" in "FieldChanged"). Reactions are deliberately not here: they are sensitive.
const SAFE_VALUES = new Set<string>([
  ...CASE_CHANGES,
  ...CASE_STATUSES,
  ...FIELDS,
  'full',
  'restricted',
]);

// Shorter values (like a 2-letter name) would match too much ordinary text.
const MIN_LENGTH_FOR_CONTAINS = 3;

function assertNoSensitiveData(details: AuditDetails, supervisionCase: SupervisionCase): void {
  const sensitive = [...sensitiveValues(supervisionCase)];
  for (const [key, value] of Object.entries(details)) {
    if (value === null || typeof value === 'boolean') continue;
    // Numbers too: a health personnel number could be stored as one.
    const text = String(value).trim();
    // Ids are how details refer to parties and users (SPEC.md F-005), so they are allowed.
    if (UUID.test(text) || SAFE_VALUES.has(text)) continue;
    const leaks = sensitive.some(
      (item) => item === text || (item.length >= MIN_LENGTH_FOR_CONTAINS && text.includes(item)),
    );
    if (leaks) throw new SensitiveAuditDataError(key);
  }
}
