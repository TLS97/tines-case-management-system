import { COMPANY_REACTION_LABELS, HEALTH_PERSONNEL_REACTION_LABELS } from '../labels';
import { useSetCompanyReaction, useSetHealthPersonnelReaction } from '../hooks/useEditCase';
import {
  COMPANY_REACTIONS,
  HEALTH_PERSONNEL_REACTIONS,
  type Company,
  type HealthPersonnel,
} from '../types';
import { editErrorMessage } from './editErrorMessage';
import { ReactionForm } from './ReactionForm';

const FAILED = 'The reaction could not be saved. Try again.';

export function HealthPersonnelReactionForm({
  caseId,
  person,
}: {
  caseId: string;
  person: HealthPersonnel;
}) {
  const save = useSetHealthPersonnelReaction(caseId, person.id);
  return (
    <ReactionForm
      partyName={`${person.firstName} ${person.surname}`}
      current={person.reaction}
      choices={HEALTH_PERSONNEL_REACTIONS}
      labels={HEALTH_PERSONNEL_REACTION_LABELS}
      isPending={save.isPending}
      savedMessage={save.isSuccess ? 'The reaction is saved.' : undefined}
      errorMessage={save.isError ? editErrorMessage(save.error, FAILED) : undefined}
      onSave={(reaction) => save.mutate(reaction)}
    />
  );
}

export function CompanyReactionForm({ caseId, company }: { caseId: string; company: Company }) {
  const save = useSetCompanyReaction(caseId, company.id);
  return (
    <ReactionForm
      partyName={company.name}
      current={company.reaction}
      choices={COMPANY_REACTIONS}
      labels={COMPANY_REACTION_LABELS}
      isPending={save.isPending}
      savedMessage={save.isSuccess ? 'The reaction is saved.' : undefined}
      errorMessage={save.isError ? editErrorMessage(save.error, FAILED) : undefined}
      onSave={(reaction) => save.mutate(reaction)}
    />
  );
}
