import { zodResolver } from '@hookform/resolvers/zod';
import {
  Alert,
  Button,
  Fieldset,
  FieldsetLegend,
  Heading,
  Label,
  Select,
} from '@digdir/designsystemet-react';
import { useForm, useWatch } from 'react-hook-form';
import {
  DEPARTMENT_IDS,
  DEPARTMENT_NAMES,
  FIELD_LABELS,
  FIELDS,
  ROLE_LABELS,
  ROLES,
  type User,
} from '@/features/auth';
import { ApiError } from '@/shared/api/apiRequest';
import { CheckboxInput } from '@/shared/components/CheckboxInput';
import { TextInput } from '@/shared/components/TextInput';
import { EMPTY_USER_FORM, toNewUser, userFormSchema } from '../forms/userForm';
import { useAddUser } from '../hooks/useUsers';
import styles from './UserAdmin.module.css';

interface AddUserFormProps {
  onAdded: (user: User) => void;
  onCancel: () => void;
}

// F-004: Admin adds a user with all User fields. New users are active.
export function AddUserForm({ onAdded, onCancel }: AddUserFormProps) {
  const add = useAddUser();
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: zodResolver(userFormSchema), defaultValues: EMPTY_USER_FORM });
  const primaryField = useWatch({ control, name: 'primaryField' });

  const onSubmit = handleSubmit((values) => {
    add.mutate(toNewUser(values), { onSuccess: onAdded });
  });

  return (
    <form
      className={styles.form}
      aria-labelledby="new-user-heading"
      onSubmit={(event) => void onSubmit(event)}
      noValidate
    >
      <Heading id="new-user-heading" level={2} data-size="sm">
        New user
      </Heading>
      <TextInput
        id="new-user-first-name"
        label="First name"
        autoComplete="off"
        error={errors.firstName?.message}
        {...register('firstName')}
      />
      <TextInput
        id="new-user-surname"
        label="Surname"
        autoComplete="off"
        error={errors.surname?.message}
        {...register('surname')}
      />
      <TextInput
        id="new-user-email"
        label="Email"
        type="email"
        size={40}
        autoComplete="off"
        error={errors.email?.message}
        {...register('email')}
      />
      <div className={styles.field}>
        <Label htmlFor="new-user-role">Role</Label>
        <Select id="new-user-role" width="auto" {...register('role')}>
          {ROLES.map((role) => (
            <option key={role} value={role}>
              {ROLE_LABELS[role]}
            </option>
          ))}
        </Select>
      </div>
      <div className={styles.field}>
        <Label htmlFor="new-user-department">Department</Label>
        <Select id="new-user-department" width="auto" {...register('departmentId')}>
          {DEPARTMENT_IDS.map((id) => (
            <option key={id} value={String(id)}>
              {DEPARTMENT_NAMES[id]}
            </option>
          ))}
        </Select>
      </div>
      <div className={styles.field}>
        <Label htmlFor="new-user-primary-field">Primary field</Label>
        <Select id="new-user-primary-field" width="auto" {...register('primaryField')}>
          {FIELDS.map((field) => (
            <option key={field} value={field}>
              {FIELD_LABELS[field]}
            </option>
          ))}
        </Select>
      </div>
      <Fieldset>
        <FieldsetLegend>Other fields (optional)</FieldsetLegend>
        {FIELDS.filter((field) => field !== primaryField).map((field) => (
          <CheckboxInput
            key={field}
            id={`new-user-field-${field}`}
            label={FIELD_LABELS[field]}
            value={field}
            {...register('otherFields')}
          />
        ))}
      </Fieldset>

      {add.isError && (
        <Alert data-color="danger">
          {add.error instanceof ApiError && add.error.status === 409
            ? 'A user with this email already exists.'
            : add.error instanceof ApiError && add.error.status === 403
              ? 'You are not allowed to add users.'
              : 'The user could not be added. Try again.'}
        </Alert>
      )}

      <div className={styles.actions}>
        <Button type="submit" loading={add.isPending}>
          Add user
        </Button>
        <Button type="button" variant="tertiary" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
