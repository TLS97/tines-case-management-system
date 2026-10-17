import { z } from 'zod';

// Audit log types from SPEC.md "F-005 Audit log".

export const AUDIT_ACTIONS = [
  'CaseCreated',
  'CaseUpdated',
  'CaseAssigned',
  'StatusChanged',
  'ReactionGiven',
  'ReadAccessGranted',
  'ReadAccessRemoved',
  'CaseOpened',
  'UserAdded',
  'UserUpdated',
] as const;

export const AUDIT_RESULTS = ['Success', 'Denied'] as const;

/** What a "case updated" entry changed (`details.change`). */
export const CASE_CHANGES = [
  'FieldChanged',
  'HealthPersonnelAdded',
  'HealthPersonnelRemoved',
  'CompanyAdded',
  'CompanyRemoved',
] as const;

export const auditActionSchema = z.enum(AUDIT_ACTIONS);
export const auditResultSchema = z.enum(AUDIT_RESULTS);
export const caseChangeSchema = z.enum(CASE_CHANGES);

/**
 * Extra facts about the action as flat key-value pairs, for example
 * `{ previousCaseWorkerId, newCaseWorkerId }` for "case assigned". Never sensitive case data
 * (SPEC.md "Sensitive case data"): refer to health personnel and companies by id.
 */
export const auditDetailsSchema = z.record(
  z.string(),
  z.union([z.string(), z.number(), z.boolean(), z.null()]),
);

export const auditEntrySchema = z.object({
  id: z.uuid(),
  timestamp: z.iso.datetime(),
  userId: z.uuid(),
  action: auditActionSchema,
  caseId: z.uuid().optional(),
  result: auditResultSchema,
  details: auditDetailsSchema,
});

export type AuditAction = z.infer<typeof auditActionSchema>;
export type AuditResult = z.infer<typeof auditResultSchema>;
export type CaseChange = z.infer<typeof caseChangeSchema>;
export type AuditDetails = z.infer<typeof auditDetailsSchema>;
export type AuditEntry = z.infer<typeof auditEntrySchema>;
