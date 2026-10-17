import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { userSchema } from '@/features/auth';
import { apiRequest } from '@/shared/api/apiRequest';

const mockUsersQuery = {
  queryKey: ['mock', 'users'],
  queryFn: () => apiRequest('/api/mock/users', { schema: z.array(userSchema) }),
};

/** All users, for the switcher (mock only). */
export function useMockUsers() {
  return useQuery(mockUsersQuery);
}

/** Acts as another user. Everything on screen depends on the user, so all data is refetched. */
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
    onSuccess: () => queryClient.invalidateQueries(),
  });
}

/** Resets the mock data to the seed data, then refetches everything shown on screen. */
export function useResetMockData() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => apiRequest('/api/mock/reset', { method: 'POST' }),
    onSuccess: () => queryClient.invalidateQueries(),
  });
}
