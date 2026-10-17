import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/shared/api/apiRequest';

/** Resets the mock data to the seed data, then refetches everything shown on screen. */
export function useResetMockData() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => apiRequest('/api/mock/reset', { method: 'POST' }),
    onSuccess: () => queryClient.invalidateQueries(),
  });
}
