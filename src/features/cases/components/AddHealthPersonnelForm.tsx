import { zodResolver } from '@hookform/resolvers/zod';
import { Alert, Button, Fieldset, FieldsetLegend, Heading } from '@digdir/designsystemet-react';
import { useFieldArray, useForm } from 'react-hook-form';
import { TextInput } from '@/shared/components/TextInput';
import {
  EMPTY_AUTHORIZATION,
  EMPTY_HEALTH_PERSONNEL_FORM,
  healthPersonnelFormSchema,
  toNewHealthPersonnel,
} from '../forms/healthPersonnelForm';
import { useAddHealthPersonnel } from '../hooks/useEditCase';
import type { HealthPersonnel } from '../types';
import styles from './CaseDetail.module.css';
import { editErrorMessage } from './editErrorMessage';

interface AddHealthPersonnelFormProps {
  caseId: string;
  onAdded: (person: HealthPersonnel) => void;
  onCancel: () => void;
}

// F-002: health personnel number, first name, surname and one or more authorizations.
export function AddHealthPersonnelForm({ caseId, onAdded, onCancel }: AddHealthPersonnelFormProps) {
  const add = useAddHealthPersonnel(caseId);
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(healthPersonnelFormSchema),
    defaultValues: EMPTY_HEALTH_PERSONNEL_FORM,
  });
  const authorizations = useFieldArray({ control, name: 'authorizations' });

  const onSubmit = handleSubmit((values) => {
    const person = toNewHealthPersonnel(values);
    add.mutate(person, {
      onSuccess: (response) => {
        const added =
          response.access === 'full'
            ? response.supervisionCase.healthPersonnel.find(
                (candidate) => candidate.healthPersonnelNumber === person.healthPersonnelNumber,
              )
            : undefined;
        if (added) onAdded(added);
      },
    });
  });

  return (
    <form
      className={styles.editForm}
      aria-labelledby="new-hp-heading"
      onSubmit={(event) => void onSubmit(event)}
      noValidate
    >
      <Heading id="new-hp-heading" level={3} data-size="xs">
        New health personnel
      </Heading>
      <TextInput
        id="new-hp-number"
        label="Health personnel number"
        description="7 to 9 digits"
        inputMode="numeric"
        size={12}
        autoComplete="off"
        error={errors.healthPersonnelNumber?.message}
        {...register('healthPersonnelNumber')}
      />
      <TextInput
        id="new-hp-first-name"
        label="First name"
        autoComplete="off"
        error={errors.firstName?.message}
        {...register('firstName')}
      />
      <TextInput
        id="new-hp-surname"
        label="Surname"
        autoComplete="off"
        error={errors.surname?.message}
        {...register('surname')}
      />

      {authorizations.fields.map((authorization, index) => {
        const fieldErrors = errors.authorizations?.[index];
        const number = index + 1;
        return (
          <Fieldset key={authorization.id} className={styles.editForm}>
            <FieldsetLegend>Authorization {number}</FieldsetLegend>
            <TextInput
              id={`new-hp-auth-${index}-description`}
              label="Description"
              autoComplete="off"
              error={fieldErrors?.description?.message}
              {...register(`authorizations.${index}.description`)}
            />
            <TextInput
              id={`new-hp-auth-${index}-from`}
              label="Valid from"
              type="date"
              size={12}
              error={fieldErrors?.validFromDate?.message}
              {...register(`authorizations.${index}.validFromDate`)}
            />
            <TextInput
              id={`new-hp-auth-${index}-to`}
              label="Valid to (optional)"
              type="date"
              size={12}
              error={fieldErrors?.validToDate?.message}
              {...register(`authorizations.${index}.validToDate`)}
            />
            {authorizations.fields.length > 1 && (
              <div>
                <Button
                  type="button"
                  variant="tertiary"
                  data-size="sm"
                  onClick={() => authorizations.remove(index)}
                >
                  Remove authorization {number}
                </Button>
              </div>
            )}
          </Fieldset>
        );
      })}

      <div>
        <Button
          type="button"
          variant="secondary"
          data-size="sm"
          onClick={() => authorizations.append(EMPTY_AUTHORIZATION)}
        >
          Add another authorization
        </Button>
      </div>

      {add.isError && (
        <Alert data-color="danger">
          {editErrorMessage(
            add.error,
            'The health personnel could not be added. Try again.',
            'This health personnel is already on the case.',
          )}
        </Alert>
      )}

      <div className={styles.inlineForm}>
        <Button type="submit" loading={add.isPending}>
          Add health personnel
        </Button>
        <Button type="button" variant="tertiary" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
