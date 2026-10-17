import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { currentUserQuery, userSchema, type User } from '@/features/auth';
import { apiRequest } from '@/shared/api/apiRequest';

const mockUsersQuery = {
  queryKey: ['mock', 'users'],
  queryFn: () => apiRequest('/api/mock/users', { schema: z.array(userSchema) }),
};

/** All users, for the switcher (mock only). */
export function useMockUsers() {
  return useQuery(mockUsersQuery);
}

/**
 * After the acting user changes, nothing loaded for the previous user may be shown or refetched
 * as-is: refetching everything at once would, for example, ask for a leader's assign list as a
 * case worker (403). So all cached data except the current user is dropped first; then the current
 * user is updated, and each part of the page that is still shown for the new user loads its data.
 */
function startOverForNewUser(queryClient: QueryClient, newUser?: User): Promise<void> {
  const [currentUserKey] = currentUserQuery.queryKey;
  queryClient.removeQueries({ predicate: (query) => query.queryKey[0] !== currentUserKey });
  if (newUser) {
    queryClient.setQueryData(currentUserQuery.queryKey, newUser);
    return Promise.resolve();
  }
  return queryClient.invalidateQueries({ queryKey: currentUserQuery.queryKey });
}

/** Acts as another user (mock only). */
export function useSwitchUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) =>
      apiRequest('/api/mock/current-user', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
        schema: userSchema,
      }),
    onSuccess: (newUser) => startOverForNewUser(queryClient, newUser),
  });
}

/** Resets the mock data to the seed data; the app then acts as the default user again. */
export function useResetMockData() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => apiRequest('/api/mock/reset', { method: 'POST' }),
    onSuccess: () => startOverForNewUser(queryClient),
  });
}
