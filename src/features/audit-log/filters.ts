import { z } from 'zod';
import { auditActionSchema, auditResultSchema, type AuditAction, type AuditResult } from './types';

// F-005 global audit log filters (Admin): case, action, user, result and date. They are kept in the
// page address (?action=CaseOpened&from=2026-10-01) and sent to the mock API the same way.

export interface AuditLogFilters {
  /** A case id or case number (2026/0001). */
  case?: string;
  action?: AuditAction;
  userId?: string;
  result?: AuditResult;
  /** First day to include (yyyy-mm-dd, in the user's time zone). */
  from?: string;
  /** Last day to include (yyyy-mm-dd, in the user's time zone). */
  to?: string;
}

export const AUDIT_FILTER_KEYS = ['case', 'action', 'userId', 'result', 'from', 'to'] as const;

const CASE_NUMBER = /^\d{4}\/\d{4,}$/;

/** A case id, or a case number like 2026/0001. */
export const caseReferenceSchema = z.union([z.uuid(), z.string().regex(CASE_NUMBER)]);

const dateSchema = z.iso.date();

/** Reads the filters from the address. Unknown or invalid values are ignored, as if they were not set. */
export function parseAuditLogFilters(params: URLSearchParams): AuditLogFilters {
  const read = <T>(key: (typeof AUDIT_FILTER_KEYS)[number], schema: z.ZodType<T>) => {
    const parsed = schema.safeParse(params.get(key)?.trim());
    return parsed.success ? { [key]: parsed.data } : {};
  };
  return {
    ...read('case', caseReferenceSchema),
    ...read('action', auditActionSchema),
    ...read('userId', z.uuid()),
    ...read('result', auditResultSchema),
    ...read('from', dateSchema),
    ...read('to', dateSchema),
  };
}

export function toSearchParams(filters: AuditLogFilters): URLSearchParams {
  const params = new URLSearchParams();
  for (const key of AUDIT_FILTER_KEYS) {
    const set = filters[key];
    if (set) params.set(key, set);
  }
  return params;
}

export function hasAuditLogFilters(filters: AuditLogFilters): boolean {
  return AUDIT_FILTER_KEYS.some((key) => filters[key] !== undefined);
}
