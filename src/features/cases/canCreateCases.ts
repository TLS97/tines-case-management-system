import { can, type User } from '@/features/auth';

/** Whether the user may create a case in at least one field (F-001: leaders, in their own fields). */
export function canCreateCases(user: User): boolean {
  return user.fields.some((field) => can(user, 'createCase', { field }));
}
