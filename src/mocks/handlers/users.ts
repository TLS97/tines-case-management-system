import { http, HttpResponse } from 'msw';
import { can, newUserSchema, type User } from '@/features/auth';
import { recordAudit } from '../auditLog';
import { currentUser, readDb, writeDb } from '../db';

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
];
