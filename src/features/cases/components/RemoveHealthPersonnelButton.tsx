import { useRemoveHealthPersonnel } from '../hooks/useEditCase';
import type { HealthPersonnel } from '../types';
import { ConfirmRemoveButton } from './ConfirmRemoveButton';
import { editErrorMessage } from './editErrorMessage';

interface RemoveHealthPersonnelButtonProps {
  caseId: string;
  person: HealthPersonnel;
  onRemoved: (person: HealthPersonnel) => void;
}

export function RemoveHealthPersonnelButton({
  caseId,
  person,
  onRemoved,
}: RemoveHealthPersonnelButtonProps) {
  const remove = useRemoveHealthPersonnel(caseId);

  return (
    <ConfirmRemoveButton
      name={`${person.firstName} ${person.surname}`}
      consequence="Their health personnel number and authorizations are removed too."
      isPending={remove.isPending}
      errorMessage={
        remove.isError
          ? editErrorMessage(remove.error, 'The health personnel could not be removed. Try again.')
          : undefined
      }
      onConfirm={(close) =>
        remove.mutate(person.id, {
          onSuccess: () => {
            close();
            onRemoved(person);
          },
        })
      }
    />
  );
}
