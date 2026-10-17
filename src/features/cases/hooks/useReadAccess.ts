import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { grantReadAccess, readAccessQuery, removeReadAccess } from '../api';
import type { ReadAccessResponse } from '../caseResponse';

export function useReadAccess(caseId: string) {
  return useQuery(readAccessQuery(caseId));
}

function useReadAccessMutation(
  caseId: string,
  mutationFn: (caseWorkerId: string) => Promise<ReadAccessResponse>,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: (response) => {
      queryClient.setQueryData(readAccessQuery(caseId).queryKey, response);
    },
  });
}

export function useGrantReadAccess(caseId: string) {
  return useReadAccessMutation(caseId, (caseWorkerId) => grantReadAccess(caseId, caseWorkerId));
}

export function useRemoveReadAccess(caseId: string) {
  return useReadAccessMutation(caseId, (caseWorkerId) => removeReadAccess(caseId, caseWorkerId));
}
