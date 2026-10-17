import { Alert, Button, Dialog, Heading, Paragraph } from '@digdir/designsystemet-react';
import { useId, useRef } from 'react';
import styles from './CaseDetail.module.css';

interface ConfirmRemoveButtonProps {
  /** Who or what is removed, shown in the button and the question. */
  name: string;
  /** What else disappears with it. */
  consequence: string;
  isPending: boolean;
  errorMessage?: string;
  /** Called on "Remove"; call `close` when the removal succeeded. */
  onConfirm: (close: () => void) => void;
}

// F-002: removing a party deletes its data from the case, so it asks first.
export function ConfirmRemoveButton({
  name,
  consequence,
  isPending,
  errorMessage,
  onConfirm,
}: ConfirmRemoveButtonProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const headingId = useId();
  const close = () => dialogRef.current?.close();

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
          <Paragraph>{consequence}</Paragraph>
          {errorMessage && <Alert data-color="danger">{errorMessage}</Alert>}
          <div className={styles.inlineForm}>
            <Button data-color="danger" loading={isPending} onClick={() => onConfirm(close)}>
              Remove
            </Button>
            <Button variant="secondary" onClick={close}>
              Cancel
            </Button>
          </div>
        </div>
      </Dialog>
    </>
  );
}
