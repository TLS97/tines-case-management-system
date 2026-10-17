import { describe, expect, it } from 'vitest';
import { newUserSchema } from '@/features/auth';
import { EMPTY_USER_FORM, toNewUser, userFormSchema } from './userForm';

const valid = {
  ...EMPTY_USER_FORM,
  firstName: ' Nina ',
  surname: 'Newcomer',
  email: ' nina.newcomer@example.com ',
  departmentId: '2',
  primaryField: 'Social',
  otherFields: ['ChildServices', 'Social'],
};

function messages(values: unknown): string[] {
  const result = userFormSchema.safeParse(values);
  return result.success ? [] : result.error.issues.map((issue) => issue.message);
}

describe('F-004 add user form', () => {
  it('turns valid input into what the mock API accepts; fields start with the primary field', () => {
    const output = toNewUser(userFormSchema.parse(valid));

    expect(output).toEqual({
      firstName: 'Nina',
      surname: 'Newcomer',
      email: 'nina.newcomer@example.com',
      role: 'CaseWorker',
      departmentId: 2,
      primaryField: 'Social',
      fields: ['Social', 'ChildServices'],
    });
    expect(newUserSchema.safeParse(output).success).toBe(true);
  });

  it('asks for the names and a valid email', () => {
    expect(messages({ ...valid, firstName: '', surname: ' ', email: 'nina@' })).toEqual([
      'Enter the first name',
      'Enter the surname',
      'Enter a valid email address, like name@example.com',
    ]);
  });
});
