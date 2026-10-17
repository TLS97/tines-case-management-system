import { useSuspenseQuery } from '@tanstack/react-query';
import { currentUserQuery } from '../api';
import type { User } from '../types';

/**
 * The user the app acts as. Always returns a user: while it loads, the nearest <Suspense> shows
 * its fallback (AppLayout has one around every page).
 */
export function useCurrentUser(): User {
  return useSuspenseQuery(currentUserQuery).data;
}
