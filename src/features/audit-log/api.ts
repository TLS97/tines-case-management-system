import { queryOptions } from '@tanstack/react-query';
import { apiRequest } from '@/shared/api/apiRequest';
import { toSearchParams, type AuditLogFilters } from './filters';
import { auditLogResponseSchema } from './types';

/** Every audit log query is under this key, so a change anywhere can refresh them all. */
export const AUDIT_LOG_KEY = ['audit-log'] as const;

/** F-005: the entries for one case, newest first (Leader, own department). */
export function caseAuditLogQuery(caseId: string) {
  return queryOptions({
    queryKey: [...AUDIT_LOG_KEY, 'case', caseId],
    queryFn: () =>
      apiRequest(`/api/cases/${encodeURIComponent(caseId)}/audit-log`, {
        schema: auditLogResponseSchema,
      }),
  });
}

/** F-005: the whole log, filtered, newest first (Admin). */
export function globalAuditLogQuery(filters: AuditLogFilters) {
  const search = toSearchParams(filters).toString();
  return queryOptions({
    queryKey: [...AUDIT_LOG_KEY, 'all', search],
    queryFn: () =>
      apiRequest(`/api/audit-log${search ? `?${search}` : ''}`, { schema: auditLogResponseSchema }),
  });
}
