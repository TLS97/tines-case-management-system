import { queryOptions } from '@tanstack/react-query';
import { z } from 'zod';
import { apiRequest } from '@/shared/api/apiRequest';
import { overviewRowSchema } from './types';

/** F-003: the cases the current user may see, newest first. Under ['cases'], so new cases refetch it. */
export const caseOverviewQuery = queryOptions({
  queryKey: ['cases', 'overview'],
  queryFn: () => apiRequest('/api/cases', { schema: z.array(overviewRowSchema) }),
});
