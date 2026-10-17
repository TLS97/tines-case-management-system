import { z } from 'zod';
import type { NewHealthPersonnel } from '../types';

// F-002 add health personnel: the same rules as newHealthPersonnelSchema (which the mock API uses),
// written for a form: strings from inputs, and messages that say what to do.

const authorizationFormSchema = z
  .object({
    description: z.string().trim(),
    validFromDate: z.iso.date('Enter the date the authorization is valid from'),
    // An empty date input means "no end date".
    validToDate: z.union([z.literal(''), z.iso.date('Enter a valid date, or leave it empty')]),
  })
  .refine((auth) => auth.validToDate === '' || auth.validToDate >= auth.validFromDate, {
    message: 'Valid to must be on or after valid from',
    path: ['validToDate'],
  });

export const healthPersonnelFormSchema = z.object({
  healthPersonnelNumber: z
    .string()
    .trim()
    .regex(/^\d{7,9}$/, 'Enter 7 to 9 digits, with no spaces or other characters'),
  firstName: z.string().trim().min(1, 'Enter the first name'),
  surname: z.string().trim().min(1, 'Enter the surname'),
  authorizations: z.array(authorizationFormSchema).min(1, 'Add at least one authorization'),
});

export type HealthPersonnelFormValues = z.infer<typeof healthPersonnelFormSchema>;

export const EMPTY_AUTHORIZATION = { description: '', validFromDate: '', validToDate: '' };

export const EMPTY_HEALTH_PERSONNEL_FORM: HealthPersonnelFormValues = {
  healthPersonnelNumber: '',
  firstName: '',
  surname: '',
  authorizations: [EMPTY_AUTHORIZATION],
};

/** Turns valid form values into what the mock API expects. */
export function toNewHealthPersonnel(values: HealthPersonnelFormValues): NewHealthPersonnel {
  return {
    healthPersonnelNumber: values.healthPersonnelNumber,
    firstName: values.firstName,
    surname: values.surname,
    authorizations: values.authorizations.map((auth) => ({
      description: auth.description,
      validFromDate: auth.validFromDate,
      validToDate: auth.validToDate === '' ? null : auth.validToDate,
    })),
  };
}
