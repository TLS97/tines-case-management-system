import { fieldSchema, type Field } from '@/features/auth';
import { caseStatusSchema, reactionSchema, type CaseStatus, type Reaction } from '@/features/cases';
import type { OverviewRow } from './types';

// F-003 overview filters: field, status and reaction, one value each (or all). They can be combined.
// They are kept in the page address (?field=Health&status=Closed), so they survive a reload.

export interface OverviewFilters {
  field?: Field;
  status?: CaseStatus;
  reaction?: Reaction;
}

export const FILTER_KEYS = ['field', 'status', 'reaction'] as const;

/** Reads the filters from the address. Unknown values are ignored, as if the filter were not set. */
export function parseFilters(params: URLSearchParams): OverviewFilters {
  const field = fieldSchema.safeParse(params.get('field'));
  const status = caseStatusSchema.safeParse(params.get('status'));
  const reaction = reactionSchema.safeParse(params.get('reaction'));
  return {
    ...(field.success && { field: field.data }),
    ...(status.success && { status: status.data }),
    ...(reaction.success && { reaction: reaction.data }),
  };
}

export function hasFilters(filters: OverviewFilters): boolean {
  return FILTER_KEYS.some((key) => filters[key] !== undefined);
}

/**
 * The rows that match every filter that is set. A case matches a reaction if any health personnel or
 * company in it has that reaction. Restricted rows (Admin) have no reactions, so they never match one.
 */
export function filterRows(rows: readonly OverviewRow[], filters: OverviewFilters): OverviewRow[] {
  return rows.filter(
    (row) =>
      (filters.field === undefined || row.field === filters.field) &&
      (filters.status === undefined || row.status === filters.status) &&
      (filters.reaction === undefined ||
        (row.access === 'full' && row.reactions.includes(filters.reaction))),
  );
}
