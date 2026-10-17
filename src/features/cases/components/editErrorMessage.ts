import { ApiError } from '@/shared/api/apiRequest';

/** The message for a failed edit (F-002). `conflict` is used for 409, if the edit has one. */
export function editErrorMessage(error: unknown, fallback: string, conflict?: string): string {
  if (error instanceof ApiError && error.status === 403) {
    return 'You are not allowed to edit this case.';
  }
  if (error instanceof ApiError && error.status === 409 && conflict) return conflict;
  return fallback;
}
