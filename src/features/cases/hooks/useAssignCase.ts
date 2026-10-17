import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AUDIT_LOG_KEY } from '@/features/audit-log';
import { assignCase, caseQuery, eligibleCaseWorkersQuery } from '../api';

export function useEligibleCaseWorkers(caseId: string) {
  return useQuery(eligibleCaseWorkersQuery(caseId));
}

/**
 * F-004: assigns the case. The page is updated from the response instead of refetching the case,
 * since every fetch of a case is logged as "case opened" (F-005). The audit log is refreshed.
 */
export function useAssignCase(caseId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (caseWorkerId: string) => assignCase(caseId, caseWorkerId),
    onSuccess: (response) => {
      queryClient.setQueryData(caseQuery(caseId).queryKey, response);
      void queryClient.invalidateQueries({ queryKey: AUDIT_LOG_KEY });
    },
  });
}
