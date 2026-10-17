import type { Field } from '@/features/auth';
import { apiRequest } from '@/shared/api/apiRequest';
import { supervisionCaseSchema } from './types';

export function createCase(input: { field: Field }) {
  return apiRequest('/api/cases', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
    schema: supervisionCaseSchema,
  });
}
