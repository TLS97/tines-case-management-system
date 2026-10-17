import { queryOptions } from '@tanstack/react-query';
import type { Field } from '@/features/auth';
import { apiRequest } from '@/shared/api/apiRequest';
import { z } from 'zod';
import { caseResponseSchema, caseWorkerSummarySchema } from './caseResponse';
import { supervisionCaseSchema } from './types';

export function createCase(input: { field: Field }) {
  return apiRequest('/api/cases', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
    schema: supervisionCaseSchema,
  });
}

/**
 * One case, as the current user may see it. Every fetch is logged as "case opened" (F-005), so it is
 * fetched once each time the page is opened, not again on window focus, and a refused or missing
 * case is not retried.
 */
export function caseQuery(id: string) {
  return queryOptions({
    queryKey: ['cases', id],
    queryFn: () =>
      apiRequest(`/api/cases/${encodeURIComponent(id)}`, { schema: caseResponseSchema }),
    refetchOnMount: 'always',
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    retry: false,
  });
}

/** F-004: the case workers the case can be assigned to (leaders only). */
export function eligibleCaseWorkersQuery(caseId: string) {
  return queryOptions({
    queryKey: ['cases', caseId, 'eligible-case-workers'],
    queryFn: () =>
      apiRequest(`/api/cases/${encodeURIComponent(caseId)}/eligible-case-workers`, {
        schema: z.array(caseWorkerSummarySchema),
      }),
  });
}

/** F-004: assigns or reassigns the case. Returns the updated case. */
export function assignCase(caseId: string, caseWorkerId: string) {
  return apiRequest(`/api/cases/${encodeURIComponent(caseId)}/assignee`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ caseWorkerId }),
    schema: caseResponseSchema,
  });
}
