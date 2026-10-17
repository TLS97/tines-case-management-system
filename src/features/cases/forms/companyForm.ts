import { z } from 'zod';
import type { NewCompany } from '../types';

// F-002 add company: the same rules as newCompanySchema (which the mock API uses), written for a
// form, with messages that say what to do.

export const companyFormSchema = z.object({
  organizationNumber: z
    .string()
    .trim()
    .regex(/^\d{9}$/, 'Enter 9 digits, with no spaces or other characters'),
  name: z.string().trim().min(1, 'Enter the company name'),
  description: z.string().trim(),
  address: z.object({
    streetName: z.string().trim().min(1, 'Enter the street name'),
    zipCode: z.string().trim().min(1, 'Enter the zip code'),
    state: z.string().trim().min(1, 'Enter the state'),
    country: z.string().trim().min(1, 'Enter the country'),
  }),
});

export type CompanyFormValues = z.infer<typeof companyFormSchema>;

export const EMPTY_COMPANY_FORM: CompanyFormValues = {
  organizationNumber: '',
  name: '',
  description: '',
  address: { streetName: '', zipCode: '', state: '', country: '' },
};

/** Valid form values are already in the shape the mock API expects. */
export function toNewCompany(values: CompanyFormValues): NewCompany {
  return { ...values, address: { ...values.address } };
}
