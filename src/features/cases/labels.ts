import type { CaseStatus, CompanyReaction, HealthPersonnelReaction, Reaction } from './types';

// UI text for the enum values in SPEC.md.

export const CASE_STATUS_LABELS: Record<CaseStatus, string> = {
  Unassigned: 'Unassigned',
  Assigned: 'Assigned',
  InProgress: 'In progress',
  Closed: 'Closed',
};

export const HEALTH_PERSONNEL_REACTION_LABELS: Record<HealthPersonnelReaction, string> = {
  NoReaction: 'No reaction',
  Prohibition: 'Prohibition',
  RestrictionOfPractice: 'Restriction of practice',
};

export const COMPANY_REACTION_LABELS: Record<CompanyReaction, string> = {
  NoReaction: 'No reaction',
  SelfAssessment: 'Self-assessment',
};

export const REACTION_LABELS: Record<Reaction, string> = {
  ...HEALTH_PERSONNEL_REACTION_LABELS,
  ...COMPANY_REACTION_LABELS,
};
