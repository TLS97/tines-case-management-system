import { useRemoveCompany } from '../hooks/useEditCase';
import type { Company } from '../types';
import { ConfirmRemoveButton } from './ConfirmRemoveButton';
import { editErrorMessage } from './editErrorMessage';

interface RemoveCompanyButtonProps {
  caseId: string;
  company: Company;
  onRemoved: (company: Company) => void;
}

export function RemoveCompanyButton({ caseId, company, onRemoved }: RemoveCompanyButtonProps) {
  const remove = useRemoveCompany(caseId);

  return (
    <ConfirmRemoveButton
      name={company.name}
      consequence="Its organization number, description and address are removed too."
      isPending={remove.isPending}
      errorMessage={
        remove.isError
          ? editErrorMessage(remove.error, 'The company could not be removed. Try again.')
          : undefined
      }
      onConfirm={(close) =>
        remove.mutate(company.id, {
          onSuccess: () => {
            close();
            onRemoved(company);
          },
        })
      }
    />
  );
}
