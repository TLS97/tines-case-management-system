import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createCase } from '../api';

/** F-001: creates a case. Case lists are refetched afterwards. */
export function useCreateCase() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createCase,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['cases'] }),
  });
}
