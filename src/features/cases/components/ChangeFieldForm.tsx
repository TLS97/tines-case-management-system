import { Alert, Button, Heading, Label, Paragraph, Select } from '@digdir/designsystemet-react';
import { useState } from 'react';
import { FIELD_LABELS, fieldSchema, type Field, type User } from '@/features/auth';
import { useChangeCaseField } from '../hooks/useEditCase';
import type { SupervisionCase } from '../types';
import styles from './CaseDetail.module.css';
import { editErrorMessage } from './editErrorMessage';

const SELECT_ID = 'change-case-field';

interface ChangeFieldFormProps {
  supervisionCase: SupervisionCase;
  /** The assigned case worker: the case can only move to one of their fields (F-002). */
  user: User;
}

export function ChangeFieldForm({ supervisionCase, user }: ChangeFieldFormProps) {
  const [field, setField] = useState<Field>(supervisionCase.field);
  const changeField = useChangeCaseField(supervisionCase.id);

  // Nothing to change to when the case worker only has the case's own field.
  if (user.fields.length < 2) return null;

  return (
    <section className={styles.section} aria-labelledby="change-field-heading">
      <Heading id="change-field-heading" level={2} data-size="sm">
        Change field
      </Heading>
      <form
        className={styles.inlineForm}
        onSubmit={(event) => {
          event.preventDefault();
          changeField.mutate(field);
        }}
      >
        <div className={styles.formField}>
          <Label htmlFor={SELECT_ID}>Field</Label>
          <Select
            id={SELECT_ID}
            width="auto"
            value={field}
            onChange={(event) => setField(fieldSchema.parse(event.target.value))}
          >
            {user.fields.map((option) => (
              <option key={option} value={option}>
                {FIELD_LABELS[option]}
              </option>
            ))}
          </Select>
        </div>
        <Button
          type="submit"
          variant="secondary"
          disabled={field === supervisionCase.field}
          loading={changeField.isPending}
        >
          Change field
        </Button>
      </form>
      <Paragraph role="status">
        {changeField.isSuccess &&
          `The field is changed to ${FIELD_LABELS[changeField.data.supervisionCase.field]}.`}
      </Paragraph>
      {changeField.isError && (
        <Alert data-color="danger">
          {editErrorMessage(changeField.error, 'The field could not be changed. Try again.')}
        </Alert>
      )}
    </section>
  );
}
