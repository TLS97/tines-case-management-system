import { useQuery } from '@tanstack/react-query';
import { caseQuery } from '../api';

/** F-002: the case as the current user may see it (full, or restricted for Admin). */
export function useCase(id: string) {
  return useQuery(caseQuery(id));
}
