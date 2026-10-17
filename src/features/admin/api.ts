import { queryOptions } from '@tanstack/react-query';
import { z } from 'zod';
import { userSchema, type DepartmentId, type NewUser, type UserFields } from '@/features/auth';
import { blockingCaseSchema } from './userCases';
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

/** F-004: deactivates a user (Admin only). Returns the updated user. */
export function deactivateUser(userId: string) {
  return apiRequest(`/api/users/${encodeURIComponent(userId)}/deactivate`, {
    method: 'POST',
    schema: userSchema,
  });
}

/** F-004: changes a user's fields (Admin only). Returns the updated user. */
export function changeUserFields(userId: string, fields: UserFields) {
  return apiRequest(`/api/users/${encodeURIComponent(userId)}/fields`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(fields),
    schema: userSchema,
  });
}

/** F-004: the open cases that keep a user from moving department (Admin only). */
export function blockingCasesQuery(userId: string) {
  return queryOptions({
    queryKey: ['users', userId, 'blocking-cases'],
    queryFn: () =>
      apiRequest(`/api/users/${encodeURIComponent(userId)}/blocking-cases`, {
        schema: z.array(blockingCaseSchema),
      }),
  });
}

/** F-004: moves a user to another department (Admin only). Returns the updated user. */
export function moveUser(userId: string, departmentId: DepartmentId) {
  return apiRequest(`/api/users/${encodeURIComponent(userId)}/department`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ departmentId }),
    schema: userSchema,
  });
}
