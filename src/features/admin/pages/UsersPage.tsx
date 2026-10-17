import { Button, Paragraph, Spinner } from '@digdir/designsystemet-react';
import { useState } from 'react';
import { can, useCurrentUser } from '@/features/auth';
import { Page } from '@/shared/components/Page';
import { AddUserForm } from '../components/AddUserForm';
import { UsersTable } from '../components/UsersTable';
import { useUsers } from '../hooks/useUsers';

// F-004 user admin (Admin only): every user, and adding users. Deactivating and changing fields and
// department come in T3.5 and T3.6.
export function UsersPage() {
  const user = useCurrentUser();

  return (
    <Page title="Users">
      {can(user, 'manageUsers') ? (
        <UserAdmin key={user.id} />
      ) : (
        <Paragraph>Only admins can manage users.</Paragraph>
      )}
    </Page>
  );
}

function UserAdmin() {
  const users = useUsers();
  const [isAdding, setIsAdding] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  return (
    <>
      {isAdding ? (
        <AddUserForm
          onAdded={(added) => {
            setIsAdding(false);
            setStatusMessage(`${added.firstName} ${added.surname} was added.`);
          }}
          onCancel={() => setIsAdding(false)}
        />
      ) : (
        <Button
          onClick={() => {
            setStatusMessage('');
            setIsAdding(true);
          }}
        >
          Add user
        </Button>
      )}
      <Paragraph role="status">{statusMessage}</Paragraph>
      {users.isPending ? (
        <Spinner aria-label="Loading users" />
      ) : users.isError ? (
        <Paragraph>The users could not be loaded. Try again.</Paragraph>
      ) : (
        <UsersTable users={users.data} />
      )}
    </>
  );
}
