import { describe, expect, it } from 'vitest';
import { newCompanySchema } from '../types';
import { companyFormSchema, toNewCompany } from './companyForm';

const valid = {
  organizationNumber: ' 900000777 ',
  name: ' Fake Clinic ',
  description: '',
  address: { streetName: 'Fake Street 3', zipCode: '0456', state: 'Fake State', country: 'Norway' },
};

function messages(values: unknown): string[] {
  const result = companyFormSchema.safeParse(values);
  return result.success ? [] : result.error.issues.map((issue) => issue.message);
}

describe('F-002 company form', () => {
  it('turns valid input into what the mock API accepts (trimmed)', () => {
    const output = toNewCompany(companyFormSchema.parse(valid));

    expect(output).toMatchObject({ organizationNumber: '900000777', name: 'Fake Clinic' });
    expect(newCompanySchema.safeParse(output).success).toBe(true);
  });

  it.each(['12345678', '1234567890', '900 000 777', '900-000-77'])(
    'rejects organization number "%s"',
    (organizationNumber) => {
      expect(messages({ ...valid, organizationNumber })).toEqual([
        'Enter 9 digits, with no spaces or other characters',
      ]);
    },
  );

  it('asks for the name and every address field; the description may be empty', () => {
    expect(
      messages({
        ...valid,
        name: ' ',
        address: { streetName: '', zipCode: '', state: '', country: '' },
      }),
    ).toEqual([
      'Enter the company name',
      'Enter the street name',
      'Enter the zip code',
      'Enter the state',
      'Enter the country',
    ]);
  });
});
