import { zodResolver } from '@hookform/resolvers/zod';
import {
  Alert,
  Button,
  Label,
  Paragraph,
  Select,
  ValidationMessage,
} from '@digdir/designsystemet-react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router';
import { z } from 'zod';
import { DEPARTMENT_NAMES, FIELD_LABELS, can, fieldSchema, type User } from '@/features/auth';
import { ApiError } from '@/shared/api/apiRequest';
import { useCreateCase } from '../hooks/useCreateCase';
import styles from './NewCaseForm.module.css';

const FIELD_SELECT_ID = 'new-case-field';
const FIELD_ERROR_ID = 'new-case-field-error';

interface NewCaseFormProps {
  user: User;
}

// F-001: the leader picks one of their fields; id, case number, status and department are set by
// the mock API.
export function NewCaseForm({ user }: NewCaseFormProps) {
  const allowedFields = user.fields.filter((field) => can(user, 'createCase', { field }));
  const formSchema = z.object({
    field: fieldSchema.refine(
      (field) => allowedFields.includes(field),
      'Choose one of your fields',
    ),
  });

  const navigate = useNavigate();
  const createCase = useCreateCase();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: { field: user.primaryField },
  });

  const onSubmit = handleSubmit(({ field }) => {
    createCase.mutate({ field }, { onSuccess: (created) => void navigate(`/cases/${created.id}`) });
  });

  return (
    <form className={styles.form} onSubmit={(event) => void onSubmit(event)} noValidate>
      <Paragraph>
        The case is created in your department, {DEPARTMENT_NAMES[user.departmentId]}. It gets a
        case number and the status Unassigned, so you can assign it to a case worker.
      </Paragraph>

      <div className={styles.field}>
        <Label htmlFor={FIELD_SELECT_ID}>Field</Label>
        <Select
          id={FIELD_SELECT_ID}
          width="auto"
          aria-invalid={errors.field ? true : undefined}
          aria-describedby={errors.field ? FIELD_ERROR_ID : undefined}
          {...register('field')}
        >
          {allowedFields.map((field) => (
            <option key={field} value={field}>
              {FIELD_LABELS[field]}
            </option>
          ))}
        </Select>
        {errors.field && (
          <ValidationMessage id={FIELD_ERROR_ID}>{errors.field.message}</ValidationMessage>
        )}
      </div>

      {createCase.isError && (
        <Alert data-color="danger">
          {createCase.error instanceof ApiError && createCase.error.status === 403
            ? 'You are not allowed to create a case in this field.'
            : 'The case could not be created. Try again.'}
        </Alert>
      )}

      <div>
        <Button type="submit" loading={createCase.isPending}>
          Create case
        </Button>
      </div>
    </form>
  );
}
