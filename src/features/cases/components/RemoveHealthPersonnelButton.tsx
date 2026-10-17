import { Alert, Button, Dialog, Heading, Paragraph } from '@digdir/designsystemet-react';
import { useId, useRef } from 'react';
import { useRemoveHealthPersonnel } from '../hooks/useEditCase';
import type { HealthPersonnel } from '../types';
import styles from './CaseDetail.module.css';
import { editErrorMessage } from './editErrorMessage';

interface RemoveHealthPersonnelButtonProps {
  caseId: string;
  person: HealthPersonnel;
  onRemoved: (person: HealthPersonnel) => void;
}

// F-002: removing a health personnel deletes their data from the case, so it asks first.
export function RemoveHealthPersonnelButton({
  caseId,
  person,
  onRemoved,
}: RemoveHealthPersonnelButtonProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const headingId = useId();
  const remove = useRemoveHealthPersonnel(caseId);
  const name = `${person.firstName} ${person.surname}`;

  return (
    <>
      <div>
        <Button
          variant="tertiary"
          data-color="danger"
          data-size="sm"
          onClick={() => dialogRef.current?.showModal()}
        >
          Remove {name}
        </Button>
      </div>
      <Dialog ref={dialogRef} closeButton="Close" aria-labelledby={headingId}>
        <div className={styles.dialogContent}>
          <Heading id={headingId} level={2} data-size="xs">
            Remove {name} from the case?
          </Heading>
          <Paragraph>Their health personnel number and authorizations are removed too.</Paragraph>
          {remove.isError && (
            <Alert data-color="danger">
              {editErrorMessage(
                remove.error,
                'The health personnel could not be removed. Try again.',
              )}
            </Alert>
          )}
          <div className={styles.inlineForm}>
            <Button
              data-color="danger"
              loading={remove.isPending}
              onClick={() =>
                remove.mutate(person.id, {
                  onSuccess: () => {
                    dialogRef.current?.close();
                    onRemoved(person);
                  },
                })
              }
            >
              Remove
            </Button>
            <Button variant="secondary" onClick={() => dialogRef.current?.close()}>
              Cancel
            </Button>
          </div>
        </div>
      </Dialog>
    </>
  );
}
