import { Alert, Button, Dialog, Heading, Paragraph } from '@digdir/designsystemet-react';
import { useId, useRef } from 'react';
import type { User } from '@/features/auth';
import { ApiError } from '@/shared/api/apiRequest';
import { useDeactivateUser } from '../hooks/useUsers';
import styles from './UserAdmin.module.css';

interface DeactivateUserButtonProps {
  user: User;
  onDeactivated: (user: User) => void;
}

// F-004: Admin deactivates a user, after confirming what it means for their cases.
export function DeactivateUserButton({ user, onDeactivated }: DeactivateUserButtonProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const headingId = useId();
  const deactivate = useDeactivateUser();
  const name = `${user.firstName} ${user.surname}`;

  return (
    <>
      <Button
        variant="tertiary"
        data-color="danger"
        data-size="sm"
        aria-label={`Deactivate ${name}`}
        onClick={() => dialogRef.current?.showModal()}
      >
        Deactivate
      </Button>
      <Dialog ref={dialogRef} closeButton="Close" aria-labelledby={headingId}>
        <div className={styles.dialogContent}>
          <Heading id={headingId} level={2} data-size="xs">
            Deactivate {name}?
          </Heading>
          <Paragraph>
            {name} can no longer use the app, be assigned cases or be given read access. Cases
            assigned to them keep them as case worker until a leader reassigns them; the leader is
            told on their Cases page.
          </Paragraph>
          {deactivate.isError && (
            <Alert data-color="danger">
              {deactivate.error instanceof ApiError && deactivate.error.status === 403
                ? 'You are not allowed to deactivate users.'
                : 'The user could not be deactivated. Try again.'}
            </Alert>
          )}
          <div className={styles.actions}>
            <Button
              data-color="danger"
              loading={deactivate.isPending}
              onClick={() =>
                deactivate.mutate(user.id, {
                  onSuccess: (updated) => {
                    dialogRef.current?.close();
                    onDeactivated(updated);
                  },
                })
              }
            >
              Deactivate
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
