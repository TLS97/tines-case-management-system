import { http, HttpResponse } from 'msw';
import { readDb, resetDb } from '../db';

// Mock-only endpoints that a real backend will not have: the user list for the user switcher
// (T0.6) and resetting the mock data. Permission-checked user endpoints come with F-004.
export const mockToolHandlers = [
  http.get('/api/mock/users', () => HttpResponse.json(readDb().users)),

  http.post('/api/mock/reset', () => {
    resetDb();
    return new HttpResponse(null, { status: 204 });
  }),
];
