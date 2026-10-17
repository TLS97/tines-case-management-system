import { http, HttpResponse } from 'msw';
import {
  parseAuditLogFilters,
  type AuditEntry,
  type AuditLogFilters,
  type AuditLogResponse,
} from '@/features/audit-log';
import { can } from '@/features/auth';
import { toLocalDate } from '@/shared/utils/formatDate';
import { currentUser, readDb, type MockDb } from '../db';

// F-005: reading the audit log. Reading it is not itself an audit action.

/** Detail keys that hold a user id, so the response can include that user's name. */
const USER_ID_KEYS = [
  'previousCaseWorkerId',
  'newCaseWorkerId',
  'caseWorkerId',
  'updatedUserId',
  'addedUserId',
];

/** Newest first, with the names of the users and the numbers of the cases the entries refer to. */
function logResponse(db: MockDb, entries: readonly AuditEntry[]): AuditLogResponse {
  const userIds = new Set<unknown>();
  const caseIds = new Set<unknown>();
  for (const entry of entries) {
    userIds.add(entry.userId);
    for (const key of USER_ID_KEYS) userIds.add(entry.details[key]);
    caseIds.add(entry.caseId);
  }
  return {
    // Stored oldest first; reversing keeps entries from the same moment in the order they happened.
    entries: [...entries].reverse(),
    users: db.users
      .filter((user) => userIds.has(user.id))
      .map(({ id, firstName, surname }) => ({ id, firstName, surname })),
    cases: db.cases
      .filter((supervisionCase) => caseIds.has(supervisionCase.id))
      .map(({ id, caseNumber }) => ({ id, caseNumber })),
  };
}

function matches(db: MockDb, entry: AuditEntry, filters: AuditLogFilters): boolean {
  const caseId =
    filters.case === undefined
      ? undefined
      : (db.cases.find((c) => c.id === filters.case || c.caseNumber === filters.case)?.id ?? null);
  const day = toLocalDate(entry.timestamp);
  return (
    (caseId === undefined || entry.caseId === caseId) &&
    (filters.action === undefined || entry.action === filters.action) &&
    (filters.userId === undefined || entry.userId === filters.userId) &&
    (filters.result === undefined || entry.result === filters.result) &&
    (filters.from === undefined || day >= filters.from) &&
    (filters.to === undefined || day <= filters.to)
  );
}

export const auditLogViewHandlers = [
  // T3.7: the entries for one case, for a leader of its department.
  http.get('/api/cases/:id/audit-log', ({ params }) => {
    const db = readDb();
    const user = currentUser(db);
    const supervisionCase = db.cases.find((candidate) => candidate.id === params.id);
    if (!supervisionCase) return new HttpResponse(null, { status: 404 });
    if (!can(user, 'viewCaseAuditLog', supervisionCase)) {
      return new HttpResponse(null, { status: 403 });
    }

    const entries = db.auditLog.filter((entry) => entry.caseId === supervisionCase.id);
    return HttpResponse.json(logResponse(db, entries));
  }),

  // T3.8: the whole log for Admin, filtered by case (id or number), action, user, result and dates.
  // Invalid filter values are ignored, like in the page address.
  http.get('/api/audit-log', ({ request }) => {
    const db = readDb();
    const user = currentUser(db);
    if (!can(user, 'viewGlobalAuditLog')) return new HttpResponse(null, { status: 403 });

    const filters = parseAuditLogFilters(new URL(request.url).searchParams);
    const entries = db.auditLog.filter((entry) => matches(db, entry, filters));
    return HttpResponse.json(logResponse(db, entries));
  }),
];
