import {
  Alert,
  Button,
  Fieldset,
  FieldsetLegend,
  Heading,
  Label,
  Link,
  ListItem,
  ListUnordered,
  Paragraph,
  Select,
  Spinner,
} from '@digdir/designsystemet-react';
import { useEffect, useRef, useState } from 'react';
import { Link as RouterLink } from 'react-router';
import {
  DEPARTMENT_IDS,
  DEPARTMENT_NAMES,
  departmentIdSchema,
  FIELD_LABELS,
  FIELDS,
  fieldSchema,
  type Field,
  type User,
} from '@/features/auth';
import { CASE_STATUS_LABELS } from '@/features/cases';
import { ApiError } from '@/shared/api/apiRequest';
import { CheckboxInput } from '@/shared/components/CheckboxInput';
import { useBlockingCases, useChangeUserFields, useMoveUser } from '../hooks/useUsers';
import styles from './UserAdmin.module.css';

interface EditUserPanelProps {
  user: User;
  onClose: () => void;
}

// F-004: Admin changes a user's fields and department.
export function EditUserPanel({ user, onClose }: EditUserPanelProps) {
  const name = `${user.firstName} ${user.surname}`;
  const headingRef = useRef<HTMLHeadingElement>(null);

  // The panel opens above the table: move focus to it, so keyboard and screen reader users land here
  // (the browser scrolls to it too).
  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  return (
    <section className={styles.panel} aria-labelledby="edit-user-heading">
      <Heading id="edit-user-heading" ref={headingRef} tabIndex={-1} level={2} data-size="sm">
        Edit {name}
      </Heading>
      <FieldsForm user={user} />
      <DepartmentForm user={user} />
      <div>
        <Button variant="secondary" onClick={onClose}>
          Done
        </Button>
      </div>
    </section>
  );
}

function FieldsForm({ user }: { user: User }) {
  const [primaryField, setPrimaryField] = useState<Field>(user.primaryField);
  const [otherFields, setOtherFields] = useState<Field[]>(
    user.fields.filter((field) => field !== user.primaryField),
  );
  const save = useChangeUserFields(user.id);
  const fields = [primaryField, ...otherFields.filter((field) => field !== primaryField)];
  const unchanged =
    primaryField === user.primaryField &&
    fields.length === user.fields.length &&
    fields.every((field) => user.fields.includes(field));

  return (
    <form
      className={styles.form}
      aria-label="Fields"
      onSubmit={(event) => {
        event.preventDefault();
        save.mutate({ primaryField, fields });
      }}
    >
      <Heading level={3} data-size="xs">
        Fields
      </Heading>
      <div className={styles.field}>
        <Label htmlFor="edit-user-primary-field">Primary field</Label>
        <Select
          id="edit-user-primary-field"
          width="auto"
          value={primaryField}
          onChange={(event) => {
            const next = fieldSchema.parse(event.target.value);
            // The old primary field stays as one of their other fields; Admin can untick it on purpose.
            setOtherFields((current) => [
              ...current.filter((field) => field !== next),
              ...(current.includes(primaryField) ? [] : [primaryField]),
            ]);
            setPrimaryField(next);
          }}
        >
          {FIELDS.map((field) => (
            <option key={field} value={field}>
              {FIELD_LABELS[field]}
            </option>
          ))}
        </Select>
      </div>
      <Fieldset>
        <FieldsetLegend>Other fields</FieldsetLegend>
        {FIELDS.filter((field) => field !== primaryField).map((field) => (
          <CheckboxInput
            key={field}
            id={`edit-user-field-${field}`}
            label={FIELD_LABELS[field]}
            checked={otherFields.includes(field)}
            onChange={(event) =>
              setOtherFields((current) =>
                event.target.checked ? [...current, field] : current.filter((f) => f !== field),
              )
            }
          />
        ))}
      </Fieldset>
      <Paragraph data-size="sm">Changing fields does not change the cases they work on.</Paragraph>
      <Button type="submit" variant="secondary" disabled={unchanged} loading={save.isPending}>
        Save fields
      </Button>
      <Paragraph role="status">{save.isSuccess ? 'The fields are saved.' : ''}</Paragraph>
      {save.isError && <Alert data-color="danger">The fields could not be saved. Try again.</Alert>}
    </form>
  );
}

function DepartmentForm({ user }: { user: User }) {
  const blocking = useBlockingCases(user.id);
  const move = useMoveUser(user.id);
  const otherDepartments = DEPARTMENT_IDS.filter((id) => id !== user.departmentId);
  const [departmentId, setDepartmentId] = useState(String(otherDepartments[0] ?? ''));
  const name = `${user.firstName} ${user.surname}`;

  return (
    <div className={styles.form}>
      <Heading level={3} data-size="xs">
        Department
      </Heading>
      <Paragraph>
        {name} is in the {DEPARTMENT_NAMES[user.departmentId]}.
      </Paragraph>
      {blocking.isPending ? (
        <Spinner aria-label="Checking open cases" />
      ) : blocking.isError ? (
        <Paragraph>Open cases could not be checked. Try again.</Paragraph>
      ) : blocking.data.length > 0 ? (
        <Alert data-color="warning">
          <Paragraph>
            {name} is the case worker of these open cases in the{' '}
            {DEPARTMENT_NAMES[user.departmentId]}. A leader there must reassign them before {name}{' '}
            can move:
          </Paragraph>
          <ListUnordered>
            {blocking.data.map((blockingCase) => (
              <ListItem key={blockingCase.caseId}>
                <Link asChild>
                  <RouterLink to={`/cases/${blockingCase.caseId}`}>
                    {blockingCase.caseNumber}
                  </RouterLink>
                </Link>{' '}
                ({CASE_STATUS_LABELS[blockingCase.status]})
              </ListItem>
            ))}
          </ListUnordered>
        </Alert>
      ) : (
        <form
          className={styles.form}
          aria-label="Move to another department"
          onSubmit={(event) => {
            event.preventDefault();
            move.mutate(departmentIdSchema.parse(Number(departmentId)));
          }}
        >
          <div className={styles.field}>
            <Label htmlFor="edit-user-department">Move to</Label>
            <Select
              id="edit-user-department"
              width="auto"
              value={departmentId}
              onChange={(event) => setDepartmentId(event.target.value)}
            >
              {otherDepartments.map((id) => (
                <option key={id} value={String(id)}>
                  {DEPARTMENT_NAMES[id]}
                </option>
              ))}
            </Select>
          </div>
          <Paragraph data-size="sm">
            Moving is permanent. Read access to cases in the old department is removed.
          </Paragraph>
          <Button type="submit" variant="secondary" loading={move.isPending}>
            Move {name}
          </Button>
        </form>
      )}
      <Paragraph role="status">
        {move.isSuccess
          ? `${name} is moved to the ${DEPARTMENT_NAMES[move.data.departmentId]}.`
          : ''}
      </Paragraph>
      {move.isError && (
        <Alert data-color="danger">
          {move.error instanceof ApiError && move.error.status === 409
            ? `${name} still has open cases in the old department.`
            : 'The user could not be moved. Try again.'}
        </Alert>
      )}
    </div>
  );
}
