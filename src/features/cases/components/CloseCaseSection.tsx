import {
  Alert,
  Button,
  Dialog,
  Heading,
  ListItem,
  ListUnordered,
  Paragraph,
} from '@digdir/designsystemet-react';
import { useRef, useState } from 'react';
import { missingForClosing } from '../closing';
import { useCloseCase } from '../hooks/useEditCase';
import type { SupervisionCase } from '../types';
import styles from './CaseDetail.module.css';
import { editErrorMessage } from './editErrorMessage';

interface CloseCaseSectionProps {
  supervisionCase: SupervisionCase;
  onClosed: () => void;
}

// F-002: the assigned case worker closes the case. It only works when the case has at least one
// health personnel or company and every one of them has a reaction; otherwise this says what is missing.
export function CloseCaseSection({ supervisionCase, onClosed }: CloseCaseSectionProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [triedTooEarly, setTriedTooEarly] = useState(false);
  const close = useCloseCase(supervisionCase.id);
  const missing = missingForClosing(supervisionCase);
  const waitingForReaction = [
    ...missing.healthPersonnelWithoutReaction.map((p) => `${p.firstName} ${p.surname}`),
    ...missing.companiesWithoutReaction.map((c) => c.name),
  ];
  const isReady = !missing.noParties && waitingForReaction.length === 0;

  return (
    <section className={styles.section} aria-labelledby="close-case-heading">
      <Heading id="close-case-heading" level={2} data-size="sm">
        Close case
      </Heading>
      {isReady ? (
        <Paragraph>
          Every health personnel and company has a reaction, so the case can be closed.
        </Paragraph>
      ) : (
        <div>
          <Paragraph>Before you can close the case:</Paragraph>
          <ListUnordered>
            {missing.noParties && (
              <ListItem>Add at least one health personnel or company.</ListItem>
            )}
            {waitingForReaction.length > 0 && (
              <ListItem>Give a reaction to: {waitingForReaction.join(', ')}.</ListItem>
            )}
          </ListUnordered>
        </div>
      )}
      {triedTooEarly && !isReady && (
        <Alert data-color="warning">
          The case cannot be closed yet. See what is missing above.
        </Alert>
      )}
      <div>
        <Button
          variant="secondary"
          onClick={() => (isReady ? dialogRef.current?.showModal() : setTriedTooEarly(true))}
        >
          Close case
        </Button>
      </div>

      <Dialog ref={dialogRef} closeButton="Close" aria-labelledby="close-case-dialog-heading">
        <div className={styles.dialogContent}>
          <Heading id="close-case-dialog-heading" level={2} data-size="xs">
            Close case {supervisionCase.caseNumber}?
          </Heading>
          <Paragraph>
            Nobody can change the case after it is closed. A leader can reopen it.
          </Paragraph>
          {close.isError && (
            <Alert data-color="danger">
              {editErrorMessage(close.error, 'The case could not be closed. Try again.')}
            </Alert>
          )}
          <div className={styles.inlineForm}>
            <Button
              loading={close.isPending}
              onClick={() =>
                close.mutate(undefined, {
                  onSuccess: () => {
                    dialogRef.current?.close();
                    onClosed();
                  },
                })
              }
            >
              Close case
            </Button>
            <Button variant="secondary" onClick={() => dialogRef.current?.close()}>
              Cancel
            </Button>
          </div>
        </div>
      </Dialog>
    </section>
  );
}
