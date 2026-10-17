import { http, HttpResponse } from 'msw';
import { z } from 'zod';
import type { AuditDetails, CaseChange } from '@/features/audit-log';
import { can, fieldSchema, type User } from '@/features/auth';
import { newHealthPersonnelSchema, type SupervisionCase } from '@/features/cases';
import { recordAudit } from '../auditLog';
import { caseResponse } from '../caseResponses';
import { currentUser, readDb, writeDb, type MockDb } from '../db';

// F-002: the assigned case worker edits the case. Every endpoint checks can(user, 'editCase', case),
// logs "case updated" (Success or Denied), and moves an Assigned case to InProgress on its first change.

const changeFieldBodySchema = z.object({ field: fieldSchema });

type EditResult = { ok: true; updated: SupervisionCase } | { ok: false; status: 400 | 409 };

/** What changed, for the audit log; refers to parties by id, never by name or number. */
type ChangeDetails = AuditDetails & { change: CaseChange };

interface CaseEdit {
  details: ChangeDetails;
  apply: (supervisionCase: SupervisionCase, user: User) => EditResult;
}

/** Loads the case, checks permission, applies the edit and saves it with its audit entries. */
function editCase(caseId: unknown, edit: CaseEdit): Response {
  const db = readDb();
  const user = currentUser(db);
  const supervisionCase = db.cases.find((candidate) => candidate.id === caseId);
  if (!supervisionCase) return new HttpResponse(null, { status: 404 });

  if (!can(user, 'editCase', supervisionCase)) {
    writeDb(
      recordAudit(db, {
        userId: user.id,
        action: 'CaseUpdated',
        result: 'Denied',
        supervisionCase,
        details: { change: edit.details.change },
      }),
    );
    return new HttpResponse(null, { status: 403 });
  }

  const result = edit.apply(supervisionCase, user);
  if (!result.ok) return new HttpResponse(null, { status: result.status });

  const next = saveChange(db, user, supervisionCase, result.updated, edit.details);
  writeDb(next);
  const saved =
    next.cases.find((candidate) => candidate.id === supervisionCase.id) ?? result.updated;
  return HttpResponse.json(caseResponse(next, { access: 'full', supervisionCase: saved }));
}

function saveChange(
  db: MockDb,
  user: User,
  before: SupervisionCase,
  changed: SupervisionCase,
  details: ChangeDetails,
): MockDb {
  // SPEC.md "Case status": the assigned case worker's first change moves Assigned to InProgress.
  const updated: SupervisionCase =
    changed.status === 'Assigned' ? { ...changed, status: 'InProgress' } : changed;
  // The audit guard checks details against both versions, so nothing removed can leak either.
  const allParties: SupervisionCase = {
    ...updated,
    healthPersonnel: [
      ...updated.healthPersonnel,
      ...before.healthPersonnel.filter((p) => !updated.healthPersonnel.some((u) => u.id === p.id)),
    ],
  };

  let next: MockDb = {
    ...db,
    cases: db.cases.map((existing) => (existing.id === updated.id ? updated : existing)),
  };
  next = recordAudit(next, {
    userId: user.id,
    action: 'CaseUpdated',
    result: 'Success',
    supervisionCase: allParties,
    details,
  });
  if (updated.status !== before.status) {
    next = recordAudit(next, {
      userId: user.id,
      action: 'StatusChanged',
      result: 'Success',
      supervisionCase: updated,
      details: { from: before.status, to: updated.status },
    });
  }
  return next;
}

async function readBody(request: Request): Promise<unknown> {
  return request.json().catch(() => undefined);
}

export const caseEditingHandlers = [
  // Change the field, only to one of the assigned case worker's fields.
  http.patch('/api/cases/:id/field', async ({ params, request }) => {
    const body = changeFieldBodySchema.safeParse(await readBody(request));
    if (!body.success) return new HttpResponse(null, { status: 400 });
    const { field } = body.data;

    return editCase(params.id, {
      details: { change: 'FieldChanged', to: field },
      apply: (supervisionCase, user) => {
        if (!user.fields.includes(field) || supervisionCase.field === field) {
          return { ok: false, status: 400 };
        }
        return { ok: true, updated: { ...supervisionCase, field } };
      },
    });
  }),

  // Add a health personnel with one or more authorizations.
  http.post('/api/cases/:id/health-personnel', async ({ params, request }) => {
    const body = newHealthPersonnelSchema.safeParse(await readBody(request));
    if (!body.success) return new HttpResponse(null, { status: 400 });
    const id = crypto.randomUUID();

    return editCase(params.id, {
      details: { change: 'HealthPersonnelAdded', healthPersonnelId: id },
      apply: (supervisionCase) => {
        const alreadyAdded = supervisionCase.healthPersonnel.some(
          (person) => person.healthPersonnelNumber === body.data.healthPersonnelNumber,
        );
        if (alreadyAdded) return { ok: false, status: 409 };
        return {
          ok: true,
          updated: {
            ...supervisionCase,
            healthPersonnel: [...supervisionCase.healthPersonnel, { id, ...body.data }],
          },
        };
      },
    });
  }),

  // Remove a health personnel from the case.
  http.delete('/api/cases/:id/health-personnel/:personId', ({ params }) => {
    const personId = String(params.personId);

    return editCase(params.id, {
      details: { change: 'HealthPersonnelRemoved', healthPersonnelId: personId },
      apply: (supervisionCase) => {
        const remaining = supervisionCase.healthPersonnel.filter((p) => p.id !== personId);
        if (remaining.length === supervisionCase.healthPersonnel.length) {
          return { ok: false, status: 400 };
        }
        return { ok: true, updated: { ...supervisionCase, healthPersonnel: remaining } };
      },
    });
  }),
];
