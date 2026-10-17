import { queryOptions } from '@tanstack/react-query';
import { z } from 'zod';
import { userSchema, type NewUser } from '@/features/auth';
import { apiRequest } from '@/shared/api/apiRequest';

/** F-004: every user (Admin only). */
export const usersQuery = queryOptions({
  queryKey: ['users'],
  queryFn: () => apiRequest('/api/users', { schema: z.array(userSchema) }),
});

/** F-004: adds a user (Admin only). Returns the new user. */
export function addUser(user: NewUser) {
  return apiRequest('/api/users', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(user),
    schema: userSchema,
  });
}
