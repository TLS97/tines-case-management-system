import type { z } from 'zod';
import { can, type User } from '@/features/auth';
import { supervisionCaseObjectSchema, type SupervisionCase } from './types';

// Admin's restricted view of a case (SPEC.md "Sensitive case data"). It is an allowlist: only the
// fields below reach Admin, so a field added to cases later stays hidden until someone decides
// otherwise. The mock API sends Admin only this view; hiding data in the UI alone is not enough
// (docs/conventions/security.md).

/** What Admin sees: case number, status, field, department and assigned case worker, plus the id to open it. */
export const ADMIN_VISIBLE_FIELDS = [
  'id',
  'caseNumber',
  'status',
  'field',
  'departmentId',
  'assignedTo',
] as const;

/** Every other case field. Health personnel and companies hold the sensitive data (identity, authorizations, company details, reactions). */
export const ADMIN_HIDDEN_FIELDS = ['readAccess', 'healthPersonnel', 'companies'] as const;

const VISIBLE = Object.fromEntries(ADMIN_VISIBLE_FIELDS.map((field) => [field, true])) as {
  [K in (typeof ADMIN_VISIBLE_FIELDS)[number]]: true;
};

/** Strict: a response that contains any hidden field is rejected. */
export const restrictedSupervisionCaseSchema = supervisionCaseObjectSchema.pick(VISIBLE).strict();

export type RestrictedSupervisionCase = z.infer<typeof restrictedSupervisionCaseSchema>;

/** Copies only the fields Admin may see. Never spread the case here: that would copy new fields too. */
export function toRestrictedCase(supervisionCase: SupervisionCase): RestrictedSupervisionCase {
  return {
    id: supervisionCase.id,
    caseNumber: supervisionCase.caseNumber,
    status: supervisionCase.status,
    field: supervisionCase.field,
    departmentId: supervisionCase.departmentId,
    assignedTo: supervisionCase.assignedTo,
  };
}

export type CaseView =
  | { access: 'full'; supervisionCase: SupervisionCase }
  | { access: 'restricted'; supervisionCase: RestrictedSupervisionCase }
  | { access: 'none' };

/** What the user may see of the case: all of it, the restricted view, or nothing (checked with can()). */
export function viewCase(user: User, supervisionCase: SupervisionCase): CaseView {
  if (can(user, 'readCase', supervisionCase)) return { access: 'full', supervisionCase };
  if (can(user, 'readCaseRestricted', supervisionCase)) {
    return { access: 'restricted', supervisionCase: toRestrictedCase(supervisionCase) };
  }
  return { access: 'none' };
}
