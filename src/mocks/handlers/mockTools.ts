import { http, HttpResponse } from 'msw';
import { z } from 'zod';
import { readDb, resetDb, writeDb } from '../db';

const switchUserBodySchema = z.object({ userId: z.uuid() });

// Mock-only endpoints that a real backend will not have: the user list and switching user for the
// user switcher, and resetting the mock data. Permission-checked user endpoints come with F-004.
export const mockToolHandlers = [
  http.get('/api/mock/users', () => HttpResponse.json(readDb().users)),

  http.put('/api/mock/current-user', async ({ request }) => {
    const body = switchUserBodySchema.safeParse(await request.json().catch(() => undefined));
    if (!body.success) return new HttpResponse(null, { status: 400 });

    const db = readDb();
    const user = db.users.find((candidate) => candidate.id === body.data.userId);
    if (!user) return new HttpResponse(null, { status: 404 });

    writeDb({ ...db, currentUserId: user.id });
    return HttpResponse.json(user);
  }),

  http.post('/api/mock/reset', () => {
    resetDb();
    return new HttpResponse(null, { status: 204 });
  }),
];
