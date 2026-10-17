import { http, HttpResponse } from 'msw';
import { currentUser, readDb } from '../db';

// The user the app acts as. In v1 this is chosen with the mock user switcher; the mock API also
// uses it for permission checks in later tasks.
export const currentUserHandlers = [
  http.get('/api/current-user', () => HttpResponse.json(currentUser(readDb()))),
];
