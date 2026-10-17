import { http, HttpResponse } from 'msw';
import { z } from 'zod';
import type { AuditAction } from '@/features/audit-log';
import { can, type User } from '@/features/auth';
import {
  canReceiveReadAccess,
  type ReadAccessResponse,
  type SupervisionCase,
} from '@/features/cases';
import { recordAudit } from '../auditLog';
import { toCaseWorkerSummary } from '../caseResponses';
import { currentUser, readDb, writeDb, type MockDb } from '../db';

// F-004: a leader gives case workers in their department read access to a case, and removes it.
// Logged as "read access granted" / "read access removed" (F-005), Success or Denied.

const grantBodySchema = z.object({ caseWorkerId: z.uuid() });

function readAccessResponse(db: MockDb, supervisionCase: SupervisionCase): ReadAccessResponse {
  const byId = (id: string) => db.users.find((user) => user.id === id);
  return {
    granted: supervisionCase.readAccess
      .map(byId)
      .filter((user): user is User => user !== undefined)
      .map(toCaseWorkerSummary),
    candidates: db.users
      .filter((user) => canReceiveReadAccess(user, supervisionCase))
      .map(toCaseWorkerSummary),
  };
}

type Loaded =
  | { ok: true; db: MockDb; user: User; supervisionCase: SupervisionCase }
  | { ok: false; response: Response };

/** Loads the case and checks can(user, 'manageReadAccess', case); a refusal is logged as `action`. */
function loadForManaging(
  caseId: unknown,
  action: Extract<AuditAction, 'ReadAccessGranted' | 'ReadAccessRemoved'> | null,
  caseWorkerId?: string,
): Loaded {
  const db = readDb();
  const user = currentUser(db);
  const supervisionCase = db.cases.find((candidate) => candidate.id === caseId);
  if (!supervisionCase) return { ok: false, response: new HttpResponse(null, { status: 404 }) };
  if (!can(user, 'manageReadAccess', supervisionCase)) {
    if (action) {
      writeDb(
        recordAudit(db, {
          userId: user.id,
          action,
          result: 'Denied',
          supervisionCase,
          details: caseWorkerId ? { caseWorkerId } : {},
        }),
      );
    }
    return { ok: false, response: new HttpResponse(null, { status: 403 }) };
  }
  return { ok: true, db, user, supervisionCase };
}

function save(
  loaded: Extract<Loaded, { ok: true }>,
  updated: SupervisionCase,
  action: 'ReadAccessGranted' | 'ReadAccessRemoved',
  caseWorkerId: string,
): Response {
  const next = recordAudit(
    {
      ...loaded.db,
      cases: loaded.db.cases.map((existing) => (existing.id === updated.id ? updated : existing)),
    },
    {
      userId: loaded.user.id,
      action,
      result: 'Success',
      supervisionCase: updated,
      details: { caseWorkerId },
    },
  );
  writeDb(next);
  return HttpResponse.json(readAccessResponse(next, updated));
}

export const caseReadAccessHandlers = [
  // Who has read access, and who the leader could give it to. Reading this list is not logged.
  http.get('/api/cases/:id/read-access', ({ params }) => {
    const loaded = loadForManaging(params.id, null);
    if (!loaded.ok) return loaded.response;
    return HttpResponse.json(readAccessResponse(loaded.db, loaded.supervisionCase));
  }),

  http.post('/api/cases/:id/read-access', async ({ params, request }) => {
    const body = grantBodySchema.safeParse(await request.json().catch(() => undefined));
    if (!body.success) return new HttpResponse(null, { status: 400 });
    const { caseWorkerId } = body.data;

    const loaded = loadForManaging(params.id, 'ReadAccessGranted', caseWorkerId);
    if (!loaded.ok) return loaded.response;
    const caseWorker = loaded.db.users.find((user) => user.id === caseWorkerId);
    if (!caseWorker || !canReceiveReadAccess(caseWorker, loaded.supervisionCase)) {
      return new HttpResponse(null, { status: 400 });
    }

    const updated = {
      ...loaded.supervisionCase,
      readAccess: [...loaded.supervisionCase.readAccess, caseWorkerId],
    };
    return save(loaded, updated, 'ReadAccessGranted', caseWorkerId);
  }),

  http.delete('/api/cases/:id/read-access/:caseWorkerId', ({ params }) => {
    const caseWorkerId = String(params.caseWorkerId);

    const loaded = loadForManaging(params.id, 'ReadAccessRemoved', caseWorkerId);
    if (!loaded.ok) return loaded.response;
    if (!loaded.supervisionCase.readAccess.includes(caseWorkerId)) {
      return new HttpResponse(null, { status: 400 });
    }

    const updated = {
      ...loaded.supervisionCase,
      readAccess: loaded.supervisionCase.readAccess.filter((id) => id !== caseWorkerId),
    };
    return save(loaded, updated, 'ReadAccessRemoved', caseWorkerId);
  }),
];
