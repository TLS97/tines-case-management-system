import { z } from 'zod';
import { departmentIdSchema, fieldSchema } from '@/features/auth';

// Case types from SPEC.md "Domain model". Zod schemas are the source; the TypeScript types are
// inferred from them, so data from the mock API and localStorage is checked at runtime (decision 0005).

export const CASE_STATUSES = ['Unassigned', 'Assigned', 'InProgress', 'Closed'] as const;
export const HEALTH_PERSONNEL_REACTIONS = [
  'NoReaction',
  'Prohibition',
  'RestrictionOfPractice',
] as const;
export const COMPANY_REACTIONS = ['NoReaction', 'SelfAssessment'] as const;
/** Every reaction, for the overview and its reaction filter (F-003). */
export const REACTIONS = [
  'NoReaction',
  'Prohibition',
  'RestrictionOfPractice',
  'SelfAssessment',
] as const;

export const caseStatusSchema = z.enum(CASE_STATUSES);
export const healthPersonnelReactionSchema = z.enum(HEALTH_PERSONNEL_REACTIONS);
export const companyReactionSchema = z.enum(COMPANY_REACTIONS);
export const reactionSchema = z.enum(REACTIONS);

/** `yyyy/nnnn`: year created, then a sequence zero-padded to 4 digits (SPEC.md "Case number"). */
export const caseNumberSchema = z
  .string()
  .regex(/^\d{4}\/\d{4,}$/, 'Case number must be yyyy/nnnn');

/** 7 to 9 digits, digits only. */
export const healthPersonnelNumberSchema = z
  .string()
  .regex(/^\d{7,9}$/, 'Health personnel number must be 7 to 9 digits');

/** 9 digits. */
export const organizationNumberSchema = z
  .string()
  .regex(/^\d{9}$/, 'Organization number must be 9 digits');

export const authorizationSchema = z
  .object({
    validFromDate: z.iso.date(),
    validToDate: z.iso.date().nullable(),
    description: z.string(),
  })
  // ISO dates (yyyy-mm-dd) compare correctly as strings.
  .refine((auth) => auth.validToDate === null || auth.validToDate >= auth.validFromDate, {
    message: 'validToDate must be on or after validFromDate',
    path: ['validToDate'],
  });

export const healthPersonnelSchema = z.object({
  id: z.uuid(),
  healthPersonnelNumber: healthPersonnelNumberSchema,
  firstName: z.string().min(1),
  surname: z.string().min(1),
  authorizations: z.array(authorizationSchema).min(1),
  reaction: healthPersonnelReactionSchema.optional(),
});

/** A health personnel as entered by the case worker; the mock API adds the id (F-002). */
export const newHealthPersonnelSchema = healthPersonnelSchema.omit({ id: true, reaction: true });

export const addressSchema = z.object({
  streetName: z.string().min(1),
  zipCode: z.string().min(1),
  state: z.string().min(1),
  country: z.string().min(1),
});

export const companySchema = z.object({
  id: z.uuid(),
  organizationNumber: organizationNumberSchema,
  name: z.string().min(1),
  description: z.string(),
  address: addressSchema,
  reaction: companyReactionSchema.optional(),
});

/** The fields of a case, without the cross-field checks (used to derive the restricted view). */
/** A company as entered by the case worker; the mock API adds the id (F-002). */
export const newCompanySchema = companySchema.omit({ id: true, reaction: true });

export const supervisionCaseObjectSchema = z.object({
  id: z.uuid(),
  caseNumber: caseNumberSchema,
  status: caseStatusSchema,
  field: fieldSchema,
  departmentId: departmentIdSchema,
  assignedTo: z.uuid().nullable(),
  readAccess: z.array(z.uuid()),
  healthPersonnel: z.array(healthPersonnelSchema),
  companies: z.array(companySchema),
});

export const supervisionCaseSchema = supervisionCaseObjectSchema
  .refine((c) => isUnique(c.healthPersonnel.map((hp) => hp.healthPersonnelNumber)), {
    message: 'The same health personnel cannot be added to a case more than once',
    path: ['healthPersonnel'],
  })
  .refine((c) => isUnique(c.companies.map((company) => company.organizationNumber)), {
    message: 'The same company cannot be added to a case more than once',
    path: ['companies'],
  })
  .refine((c) => isUnique(c.readAccess), {
    message: 'A user can only be given read access once',
    path: ['readAccess'],
  });

function isUnique(values: readonly string[]): boolean {
  return new Set(values).size === values.length;
}

export type CaseStatus = z.infer<typeof caseStatusSchema>;
export type HealthPersonnelReaction = z.infer<typeof healthPersonnelReactionSchema>;
export type CompanyReaction = z.infer<typeof companyReactionSchema>;
export type Reaction = z.infer<typeof reactionSchema>;
export type Authorization = z.infer<typeof authorizationSchema>;
export type HealthPersonnel = z.infer<typeof healthPersonnelSchema>;
export type NewHealthPersonnel = z.infer<typeof newHealthPersonnelSchema>;
export type Address = z.infer<typeof addressSchema>;
export type Company = z.infer<typeof companySchema>;
export type NewCompany = z.infer<typeof newCompanySchema>;
export type SupervisionCase = z.infer<typeof supervisionCaseSchema>;
