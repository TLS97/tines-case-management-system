import { zodResolver } from '@hookform/resolvers/zod';
import { Alert, Button, Fieldset, FieldsetLegend, Heading } from '@digdir/designsystemet-react';
import { useForm } from 'react-hook-form';
import { TextInput } from '@/shared/components/TextInput';
import { companyFormSchema, EMPTY_COMPANY_FORM, toNewCompany } from '../forms/companyForm';
import { useAddCompany } from '../hooks/useEditCase';
import type { Company } from '../types';
import styles from './CaseDetail.module.css';
import { editErrorMessage } from './editErrorMessage';

interface AddCompanyFormProps {
  caseId: string;
  onAdded: (company: Company) => void;
  onCancel: () => void;
}

// F-002: organization number (9 digits), name, description and address.
export function AddCompanyForm({ caseId, onAdded, onCancel }: AddCompanyFormProps) {
  const add = useAddCompany(caseId);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: zodResolver(companyFormSchema), defaultValues: EMPTY_COMPANY_FORM });

  const onSubmit = handleSubmit((values) => {
    const company = toNewCompany(values);
    add.mutate(company, {
      onSuccess: (response) => {
        const added =
          response.access === 'full'
            ? response.supervisionCase.companies.find(
                (candidate) => candidate.organizationNumber === company.organizationNumber,
              )
            : undefined;
        if (added) onAdded(added);
      },
    });
  });

  return (
    <form
      className={styles.editForm}
      aria-labelledby="new-company-heading"
      onSubmit={(event) => void onSubmit(event)}
      noValidate
    >
      <Heading id="new-company-heading" level={3} data-size="xs">
        New company
      </Heading>
      <TextInput
        id="new-company-number"
        label="Organization number"
        description="9 digits"
        inputMode="numeric"
        size={12}
        autoComplete="off"
        error={errors.organizationNumber?.message}
        {...register('organizationNumber')}
      />
      <TextInput
        id="new-company-name"
        label="Name"
        size={40}
        autoComplete="off"
        error={errors.name?.message}
        {...register('name')}
      />
      <TextInput
        id="new-company-description"
        label="Description (optional)"
        size={40}
        autoComplete="off"
        error={errors.description?.message}
        {...register('description')}
      />
      <Fieldset className={styles.editForm}>
        <FieldsetLegend>Address</FieldsetLegend>
        <TextInput
          id="new-company-street"
          label="Street name"
          size={40}
          autoComplete="off"
          error={errors.address?.streetName?.message}
          {...register('address.streetName')}
        />
        <TextInput
          id="new-company-zip"
          label="Zip code"
          size={10}
          autoComplete="off"
          error={errors.address?.zipCode?.message}
          {...register('address.zipCode')}
        />
        <TextInput
          id="new-company-state"
          label="State"
          autoComplete="off"
          error={errors.address?.state?.message}
          {...register('address.state')}
        />
        <TextInput
          id="new-company-country"
          label="Country"
          autoComplete="off"
          error={errors.address?.country?.message}
          {...register('address.country')}
        />
      </Fieldset>

      {add.isError && (
        <Alert data-color="danger">
          {editErrorMessage(
            add.error,
            'The company could not be added. Try again.',
            'This company is already on the case.',
          )}
        </Alert>
      )}

      <div className={styles.inlineForm}>
        <Button type="submit" loading={add.isPending}>
          Add company
        </Button>
        <Button type="button" variant="tertiary" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
