import { http, HttpResponse } from 'msw';
import { readDb } from '../db';

// The user the app acts as. In v1 this is chosen with the mock user switcher; the mock API also
// uses it for permission checks in later tasks.
export const currentUserHandlers = [
  http.get('/api/current-user', () => {
    const db = readDb();
    // readDb guarantees that currentUserId belongs to a user.
    const user = db.users.find((candidate) => candidate.id === db.currentUserId);
    return user ? HttpResponse.json(user) : new HttpResponse(null, { status: 500 });
  }),
];
