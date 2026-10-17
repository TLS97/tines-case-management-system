import type { AuditAction, AuditResult } from './types';

export const AUDIT_ACTION_LABELS: Record<AuditAction, string> = {
  CaseCreated: 'Case created',
  CaseUpdated: 'Case updated',
  CaseAssigned: 'Case assigned',
  StatusChanged: 'Status changed',
  ReactionGiven: 'Reaction given',
  ReadAccessGranted: 'Read access granted',
  ReadAccessRemoved: 'Read access removed',
  CaseOpened: 'Case opened',
  UserAdded: 'User added',
  UserUpdated: 'User updated',
};

export const AUDIT_RESULT_LABELS: Record<AuditResult, string> = {
  Success: 'Success',
  Denied: 'Denied',
};
