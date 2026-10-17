import { REACTIONS, type Reaction, type SupervisionCase } from './types';

/** The reactions given in a case, each once, in the usual order (F-003 overview and reaction filter). */
export function reactionsInCase(supervisionCase: SupervisionCase): Reaction[] {
  const given = new Set<Reaction>();
  for (const person of supervisionCase.healthPersonnel)
    if (person.reaction) given.add(person.reaction);
  for (const company of supervisionCase.companies)
    if (company.reaction) given.add(company.reaction);
  return REACTIONS.filter((reaction) => given.has(reaction));
}
