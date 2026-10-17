import { http, HttpResponse } from 'msw';
import { z } from 'zod';
import type { BlockingCase } from '@/features/admin';
import type { AuditDetails } from '@/features/audit-log';
import {
  can,
  departmentIdSchema,
  newUserSchema,
  userFieldsSchema,
  type User,
} from '@/features/auth';
import { recordAudit } from '../auditLog';
import { currentUser, readDb, writeDb, type MockDb } from '../db';

const moveBodySchema = z.object({ departmentId: departmentIdSchema });

/**
 * F-004: open cases (not Closed) in the user's current department where they are the case worker.
 * While there are any, the user cannot move department. Borrowed cases elsewhere do not count.
 */
function casesBlockingMove(db: MockDb, user: User): BlockingCase[] {
  return db.cases
    .filter(
      (c) =>
        c.assignedTo === user.id && c.departmentId === user.departmentId && c.status !== 'Closed',
    )
    .map((c) => ({ caseId: c.id, caseNumber: c.caseNumber, status: c.status }));
}

/** Loads the target user and checks that the current user is Admin; a refusal is logged as Denied. */
function loadForAdmin(
  userId: unknown,
  deniedDetails: AuditDetails,
): { ok: true; db: MockDb; admin: User; target: User } | { ok: false; response: Response } {
  const db = readDb();
  const admin = currentUser(db);
  const target = db.users.find((user) => user.id === userId);
  if (!target) return { ok: false, response: new HttpResponse(null, { status: 404 }) };
  if (!can(admin, 'manageUsers')) {
    writeDb(
      recordAudit(db, {
        userId: admin.id,
        action: 'UserUpdated',
        result: 'Denied',
        details: { updatedUserId: target.id, ...deniedDetails },
      }),
    );
    return { ok: false, response: new HttpResponse(null, { status: 403 }) };
  }
  return { ok: true, db, admin, target };
}

// F-004 user admin (Admin only). Listing users is not an audit action; adding is ("user added", F-005).
export const userHandlers = [
  http.get('/api/users', () => {
    const db = readDb();
    if (!can(currentUser(db), 'manageUsers')) return new HttpResponse(null, { status: 403 });
    return HttpResponse.json(db.users);
  }),

  http.post('/api/users', async ({ request }) => {
    const db = readDb();
    const admin = currentUser(db);
    if (!can(admin, 'manageUsers')) {
      writeDb(recordAudit(db, { userId: admin.id, action: 'UserAdded', result: 'Denied' }));
      return new HttpResponse(null, { status: 403 });
    }

    const body = newUserSchema.safeParse(await request.json().catch(() => undefined));
    if (!body.success) return new HttpResponse(null, { status: 400 });

    // Email must be unique (F-004); compared without regard to case.
    const email = body.data.email.toLowerCase();
    if (db.users.some((user) => user.email.toLowerCase() === email)) {
      return new HttpResponse(null, { status: 409 });
    }

    const user: User = {
      ...body.data,
      email,
      id: crypto.randomUUID(),
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: null,
    };
    writeDb(
      recordAudit(
        { ...db, users: [...db.users, user] },
        {
          userId: admin.id,
          action: 'UserAdded',
          result: 'Success',
          details: { addedUserId: user.id },
        },
      ),
    );
    return HttpResponse.json(user, { status: 201 });
  }),

  // F-004: Admin deactivates a user. Their cases keep them as case worker until a leader reassigns.
  http.post('/api/users/:id/deactivate', ({ params }) => {
    const db = readDb();
    const admin = currentUser(db);
    const target = db.users.find((user) => user.id === params.id);
    if (!target) return new HttpResponse(null, { status: 404 });
    if (!can(admin, 'manageUsers')) {
      writeDb(
        recordAudit(db, {
          userId: admin.id,
          action: 'UserUpdated',
          result: 'Denied',
          details: { updatedUserId: target.id, isActive: false },
        }),
      );
      return new HttpResponse(null, { status: 403 });
    }
    // Already inactive, or the admin themselves (they would lock themselves out).
    if (!target.isActive || target.id === admin.id) return new HttpResponse(null, { status: 400 });

    const updated: User = { ...target, isActive: false, updatedAt: new Date().toISOString() };
    writeDb(
      recordAudit(
        { ...db, users: db.users.map((user) => (user.id === updated.id ? updated : user)) },
        {
          userId: admin.id,
          action: 'UserUpdated',
          result: 'Success',
          details: { updatedUserId: updated.id, isActive: false },
        },
      ),
    );
    return HttpResponse.json(updated);
  }),

  // F-004: change which fields a user has. Their cases do not change.
  http.put('/api/users/:id/fields', async ({ params, request }) => {
    const body = userFieldsSchema.safeParse(await request.json().catch(() => undefined));
    if (!body.success) return new HttpResponse(null, { status: 400 });
    const loaded = loadForAdmin(params.id, { change: 'Fields' });
    if (!loaded.ok) return loaded.response;
    const { db, admin, target } = loaded;

    const unchanged =
      target.primaryField === body.data.primaryField &&
      target.fields.length === body.data.fields.length &&
      target.fields.every((field) => body.data.fields.includes(field));
    if (unchanged) return new HttpResponse(null, { status: 400 });

    const updated: User = { ...target, ...body.data, updatedAt: new Date().toISOString() };
    writeDb(
      recordAudit(
        { ...db, users: db.users.map((user) => (user.id === updated.id ? updated : user)) },
        {
          userId: admin.id,
          action: 'UserUpdated',
          result: 'Success',
          details: {
            updatedUserId: updated.id,
            change: 'Fields',
            primaryField: updated.primaryField,
            fields: updated.fields.join(', '),
          },
        },
      ),
    );
    return HttpResponse.json(updated);
  }),

  // F-004: the open cases that keep a user from moving department (Admin only; not logged).
  http.get('/api/users/:id/blocking-cases', ({ params }) => {
    const db = readDb();
    const target = db.users.find((user) => user.id === params.id);
    if (!target) return new HttpResponse(null, { status: 404 });
    if (!can(currentUser(db), 'manageUsers')) return new HttpResponse(null, { status: 403 });
    return HttpResponse.json(casesBlockingMove(db, target));
  }),

  // F-004: move a user to another department, permanently. Blocked (409) while they are the case
  // worker of open cases in their current department. Read access to old-department cases is removed.
  http.put('/api/users/:id/department', async ({ params, request }) => {
    const body = moveBodySchema.safeParse(await request.json().catch(() => undefined));
    if (!body.success) return new HttpResponse(null, { status: 400 });
    const { departmentId } = body.data;
    const loaded = loadForAdmin(params.id, { change: 'Department', toDepartmentId: departmentId });
    if (!loaded.ok) return loaded.response;
    const { db, admin, target } = loaded;
    if (target.departmentId === departmentId) return new HttpResponse(null, { status: 400 });
    if (casesBlockingMove(db, target).length > 0) return new HttpResponse(null, { status: 409 });

    const moved: User = { ...target, departmentId, updatedAt: new Date().toISOString() };
    let next: MockDb = {
      ...db,
      users: db.users.map((user) => (user.id === moved.id ? moved : user)),
    };
    for (const supervisionCase of db.cases) {
      if (supervisionCase.departmentId !== target.departmentId) continue;
      if (!supervisionCase.readAccess.includes(target.id)) continue;
      const updatedCase = {
        ...supervisionCase,
        readAccess: supervisionCase.readAccess.filter((id) => id !== target.id),
      };
      next = recordAudit(
        { ...next, cases: next.cases.map((c) => (c.id === updatedCase.id ? updatedCase : c)) },
        {
          userId: admin.id,
          action: 'ReadAccessRemoved',
          result: 'Success',
          supervisionCase: updatedCase,
          details: { caseWorkerId: target.id, reason: 'MovedDepartment' },
        },
      );
    }
    next = recordAudit(next, {
      userId: admin.id,
      action: 'UserUpdated',
      result: 'Success',
      details: {
        updatedUserId: moved.id,
        change: 'Department',
        fromDepartmentId: target.departmentId,
        toDepartmentId: departmentId,
      },
    });
    writeDb(next);
    return HttpResponse.json(moved);
  }),

  // F-004: Admin reactivates a deactivated user. They can use the app again and be assigned cases.
  http.post('/api/users/:id/reactivate', ({ params }) => {
    const loaded = loadForAdmin(params.id, { isActive: true });
    if (!loaded.ok) return loaded.response;
    const { db, admin, target } = loaded;
    if (target.isActive) return new HttpResponse(null, { status: 400 });

    const updated: User = { ...target, isActive: true, updatedAt: new Date().toISOString() };
    writeDb(
      recordAudit(
        { ...db, users: db.users.map((user) => (user.id === updated.id ? updated : user)) },
        {
          userId: admin.id,
          action: 'UserUpdated',
          result: 'Success',
          details: { updatedUserId: updated.id, isActive: true },
        },
      ),
    );
    return HttpResponse.json(updated);
  }),
];
