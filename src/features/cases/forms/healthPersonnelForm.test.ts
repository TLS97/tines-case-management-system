import { describe, expect, it } from 'vitest';
import { newHealthPersonnelSchema } from '../types';
import { healthPersonnelFormSchema, toNewHealthPersonnel } from './healthPersonnelForm';

const valid = {
  healthPersonnelNumber: ' 9000123 ',
  firstName: ' Fakefirst ',
  surname: 'Fakelast',
  authorizations: [{ description: 'Nurse', validFromDate: '2020-01-01', validToDate: '' }],
};

function messages(values: unknown): string[] {
  const result = healthPersonnelFormSchema.safeParse(values);
  return result.success ? [] : result.error.issues.map((issue) => issue.message);
}

describe('F-002 health personnel form', () => {
  it('turns valid input into what the mock API accepts: trimmed, empty end date as null', () => {
    const parsed = healthPersonnelFormSchema.parse(valid);
    const output = toNewHealthPersonnel(parsed);

    expect(output).toEqual({
      healthPersonnelNumber: '9000123',
      firstName: 'Fakefirst',
      surname: 'Fakelast',
      authorizations: [{ description: 'Nurse', validFromDate: '2020-01-01', validToDate: null }],
    });
    expect(newHealthPersonnelSchema.safeParse(output).success).toBe(true);
  });

  it.each([
    ['123456', 'Enter 7 to 9 digits, with no spaces or other characters'],
    ['123 4567', 'Enter 7 to 9 digits, with no spaces or other characters'],
    ['1234567890', 'Enter 7 to 9 digits, with no spaces or other characters'],
  ])('rejects health personnel number "%s"', (healthPersonnelNumber, message) => {
    expect(messages({ ...valid, healthPersonnelNumber })).toEqual([message]);
  });

  it('asks for first name and surname', () => {
    expect(messages({ ...valid, firstName: '  ', surname: '' })).toEqual([
      'Enter the first name',
      'Enter the surname',
    ]);
  });

  it('asks for a valid-from date, and an end date on or after it', () => {
    expect(
      messages({
        ...valid,
        authorizations: [{ description: '', validFromDate: '', validToDate: '' }],
      }),
    ).toEqual(['Enter the date the authorization is valid from']);
    expect(
      messages({
        ...valid,
        authorizations: [
          { description: '', validFromDate: '2020-01-02', validToDate: '2020-01-01' },
        ],
      }),
    ).toEqual(['Valid to must be on or after valid from']);
  });

  it('needs at least one authorization', () => {
    expect(messages({ ...valid, authorizations: [] })).toEqual(['Add at least one authorization']);
  });
});
