import { z } from 'zod';
import { departmentIdSchema, FIELDS, ROLES, type Field, type NewUser } from '@/features/auth';

// F-004 add user: the same rules as newUserSchema (which the mock API uses), written for a form.
// The primary field is chosen on its own; "other fields" are the rest, so fields always include it.

export const userFormSchema = z.object({
  firstName: z.string().trim().min(1, 'Enter the first name'),
  surname: z.string().trim().min(1, 'Enter the surname'),
  email: z.string().trim().pipe(z.email('Enter a valid email address, like name@example.com')),
  role: z.enum(ROLES),
  departmentId: z.enum(['1', '2', '3']),
  primaryField: z.enum(FIELDS),
  otherFields: z.array(z.enum(FIELDS)),
});

export type UserFormValues = z.infer<typeof userFormSchema>;

export const EMPTY_USER_FORM: UserFormValues = {
  firstName: '',
  surname: '',
  email: '',
  role: 'CaseWorker',
  departmentId: '1',
  primaryField: 'Health',
  otherFields: [],
};

/** Valid form values in the shape the mock API expects. */
export function toNewUser(values: UserFormValues): NewUser {
  const others = values.otherFields.filter((field: Field) => field !== values.primaryField);
  return {
    firstName: values.firstName,
    surname: values.surname,
    email: values.email,
    role: values.role,
    departmentId: departmentIdSchema.parse(Number(values.departmentId)),
    primaryField: values.primaryField,
    fields: [values.primaryField, ...new Set(others)],
  };
}
