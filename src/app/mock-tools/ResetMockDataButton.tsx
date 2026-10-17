import { Button, Dialog, Heading, Paragraph } from '@digdir/designsystemet-react';
import { useRef } from 'react';
import styles from './MockToolbar.module.css';
import { useResetMockData } from './resetMockData';

// Resetting deletes all data, so it asks for confirmation first.
export function ResetMockDataButton() {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const reset = useResetMockData();

  function confirmReset() {
    reset.mutate(undefined, { onSettled: () => dialogRef.current?.close() });
  }

  return (
    <>
      <Button variant="tertiary" data-size="sm" onClick={() => dialogRef.current?.showModal()}>
        Reset mock data
      </Button>
      <Paragraph role="status" data-size="sm">
        {reset.isSuccess && 'Mock data has been reset.'}
        {reset.isError && 'Could not reset the mock data. Try again.'}
      </Paragraph>
      <Dialog ref={dialogRef} closeButton="Close" aria-labelledby="reset-mock-data-heading">
        <div className={styles.dialogContent}>
          <Heading id="reset-mock-data-heading" level={2} data-size="xs">
            Reset mock data?
          </Heading>
          <Paragraph>
            All cases and changes are deleted, and the seed data from the specification is loaded
            again.
          </Paragraph>
          <div className={styles.dialogActions}>
            <Button data-color="danger" onClick={confirmReset} loading={reset.isPending}>
              Reset
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
