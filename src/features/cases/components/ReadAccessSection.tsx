import {
  Alert,
  Button,
  Heading,
  Label,
  ListItem,
  ListUnordered,
  Paragraph,
  Select,
  Spinner,
} from '@digdir/designsystemet-react';
import { useId, useState } from 'react';
import { caseWorkerDisplayName } from '../caseResponse';
import { useGrantReadAccess, useReadAccess, useRemoveReadAccess } from '../hooks/useReadAccess';
import styles from './CaseDetail.module.css';
import { ApiError } from '@/shared/api/apiRequest';

interface ReadAccessSectionProps {
  caseId: string;
}

// F-004: the leader gives case workers in the department read access, and removes it. Shown only when
// can(user, 'manageReadAccess', case), so not on closed cases.
export function ReadAccessSection({ caseId }: ReadAccessSectionProps) {
  const selectId = useId();
  const readAccess = useReadAccess(caseId);
  const grant = useGrantReadAccess(caseId);
  const remove = useRemoveReadAccess(caseId);
  const [selected, setSelected] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const failed = grant.isError ? grant.error : remove.isError ? remove.error : undefined;

  return (
    <section className={styles.section} aria-labelledby="read-access-heading">
      <Heading id="read-access-heading" level={2} data-size="sm">
        Read access
      </Heading>
      <Paragraph>Case workers with read access can open the case, but not change it.</Paragraph>

      {readAccess.isPending ? (
        <Spinner aria-label="Loading read access" />
      ) : readAccess.isError ? (
        <Paragraph>Read access could not be loaded. Try again.</Paragraph>
      ) : (
        <>
          {readAccess.data.granted.length === 0 ? (
            <Paragraph>No case workers have read access.</Paragraph>
          ) : (
            <ListUnordered>
              {readAccess.data.granted.map((caseWorker) => {
                const name = caseWorkerDisplayName(caseWorker);
                return (
                  <ListItem key={caseWorker.id} className={styles.accessItem}>
                    <span>{name}</span>
                    <Button
                      variant="tertiary"
                      data-color="danger"
                      data-size="sm"
                      aria-label={`Remove read access for ${name}`}
                      onClick={() =>
                        remove.mutate(caseWorker.id, {
                          onSuccess: () => setStatusMessage(`${name} no longer has read access.`),
                        })
                      }
                    >
                      Remove
                    </Button>
                  </ListItem>
                );
              })}
            </ListUnordered>
          )}

          {readAccess.data.candidates.length === 0 ? (
            <Paragraph>
              There are no other active case workers in your department to give read access to.
            </Paragraph>
          ) : (
            <form
              className={styles.inlineForm}
              onSubmit={(event) => {
                event.preventDefault();
                const caseWorker = readAccess.data.candidates.find((c) => c.id === selected);
                if (!caseWorker) return;
                grant.mutate(caseWorker.id, {
                  onSuccess: () => {
                    setSelected('');
                    setStatusMessage(`${caseWorkerDisplayName(caseWorker)} has read access.`);
                  },
                });
              }}
            >
              <div className={styles.formField}>
                <Label htmlFor={selectId}>Give read access to</Label>
                <Select
                  id={selectId}
                  width="auto"
                  value={selected}
                  onChange={(event) => setSelected(event.target.value)}
                >
                  <option value="">Choose a case worker</option>
                  {readAccess.data.candidates.map((caseWorker) => (
                    <option key={caseWorker.id} value={caseWorker.id}>
                      {caseWorkerDisplayName(caseWorker)}
                    </option>
                  ))}
                </Select>
              </div>
              <Button
                type="submit"
                variant="secondary"
                disabled={!selected}
                loading={grant.isPending}
              >
                Give read access
              </Button>
            </form>
          )}
        </>
      )}

      <Paragraph role="status">{statusMessage}</Paragraph>
      {failed !== undefined && <Alert data-color="danger">{readAccessErrorMessage(failed)}</Alert>}
    </section>
  );
}

function readAccessErrorMessage(error: unknown): string {
  return error instanceof ApiError && error.status === 403
    ? 'You are not allowed to change read access for this case.'
    : 'Read access could not be changed. Try again.';
}
