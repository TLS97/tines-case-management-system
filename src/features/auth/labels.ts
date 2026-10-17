import type { Field, Role } from './types';

// UI text for the enum values in SPEC.md.

export const ROLE_LABELS: Record<Role, string> = {
  CaseWorker: 'Case worker',
  Leader: 'Leader',
  Admin: 'Admin',
};

export const FIELD_LABELS: Record<Field, string> = {
  Health: 'Health',
  Social: 'Social',
  ChildServices: 'Child services',
};
