import { z } from 'zod';

// User types from SPEC.md. Zod schemas are the source; the TypeScript types are inferred from them,
// so data from the mock API and localStorage can be checked at runtime (decision 0005).

export const ROLES = ['CaseWorker', 'Leader', 'Admin'] as const;
export const FIELDS = ['Health', 'Social', 'ChildServices'] as const;
export const DEPARTMENT_IDS = [1, 2, 3] as const;

export const DEPARTMENT_NAMES: Record<DepartmentId, string> = {
  1: 'Department of Supervision',
  2: 'Department of Child Welfare',
  3: 'Department of Business Management',
};

export const roleSchema = z.enum(ROLES);
export const fieldSchema = z.enum(FIELDS);
export const departmentIdSchema = z.literal(DEPARTMENT_IDS);

export const userSchema = z
  .object({
    id: z.uuid(),
    firstName: z.string().min(1),
    surname: z.string().min(1),
    email: z.email(),
    isActive: z.boolean(),
    createdAt: z.iso.datetime(),
    updatedAt: z.iso.datetime().nullable(),
    departmentId: departmentIdSchema,
    role: roleSchema,
    primaryField: fieldSchema,
    fields: z.array(fieldSchema).min(1),
  })
  .refine((user) => user.fields.includes(user.primaryField), {
    message: 'fields must include primaryField',
    path: ['fields'],
  });

/**
 * F-004: a user as Admin enters them. The mock API adds id, createdAt and updatedAt; new users are active.
 */
export const newUserSchema = z
  .object({
    firstName: z.string().trim().min(1),
    surname: z.string().trim().min(1),
    email: z.email(),
    departmentId: departmentIdSchema,
    role: roleSchema,
    primaryField: fieldSchema,
    fields: z.array(fieldSchema).min(1),
  })
  .refine((user) => user.fields.includes(user.primaryField), {
    message: 'fields must include primaryField',
    path: ['fields'],
  })
  .refine((user) => new Set(user.fields).size === user.fields.length, {
    message: 'fields must not repeat',
    path: ['fields'],
  });

/** F-004: Admin changes a user's fields. `fields` must include `primaryField` and not repeat. */
export const userFieldsSchema = z
  .object({ primaryField: fieldSchema, fields: z.array(fieldSchema).min(1) })
  .refine((value) => value.fields.includes(value.primaryField), {
    message: 'fields must include primaryField',
    path: ['fields'],
  })
  .refine((value) => new Set(value.fields).size === value.fields.length, {
    message: 'fields must not repeat',
    path: ['fields'],
  });

export type Role = z.infer<typeof roleSchema>;
export type Field = z.infer<typeof fieldSchema>;
export type DepartmentId = z.infer<typeof departmentIdSchema>;
export type User = z.infer<typeof userSchema>;
export type NewUser = z.infer<typeof newUserSchema>;
export type UserFields = z.infer<typeof userFieldsSchema>;
