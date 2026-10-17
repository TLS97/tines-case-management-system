import type { Company, HealthPersonnel, SupervisionCase } from './types';

// F-002: a case can only be closed when it has at least one health personnel or company and every
// one of them has a reaction. Whether the user may close at all is can(user, 'closeCase', case).

export interface MissingForClosing {
  /** The case has no health personnel and no companies. */
  noParties: boolean;
  healthPersonnelWithoutReaction: HealthPersonnel[];
  companiesWithoutReaction: Company[];
}

export function missingForClosing(supervisionCase: SupervisionCase): MissingForClosing {
  return {
    noParties:
      supervisionCase.healthPersonnel.length === 0 && supervisionCase.companies.length === 0,
    healthPersonnelWithoutReaction: supervisionCase.healthPersonnel.filter(
      (person) => person.reaction === undefined,
    ),
    companiesWithoutReaction: supervisionCase.companies.filter(
      (company) => company.reaction === undefined,
    ),
  };
}

export function isReadyToClose(supervisionCase: SupervisionCase): boolean {
  const missing = missingForClosing(supervisionCase);
  return (
    !missing.noParties &&
    missing.healthPersonnelWithoutReaction.length === 0 &&
    missing.companiesWithoutReaction.length === 0
  );
}
