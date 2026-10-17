import { Button, Paragraph, Spinner } from '@digdir/designsystemet-react';
import { useState } from 'react';
import { can, useCurrentUser } from '@/features/auth';
import { ApiError } from '@/shared/api/apiRequest';
import { Page } from '@/shared/components/Page';
import { AddUserForm } from '../components/AddUserForm';
import { EditUserPanel } from '../components/EditUserPanel';
import { UsersTable } from '../components/UsersTable';
import { useUsers } from '../hooks/useUsers';

// F-004 user admin (Admin only): every user; adding, deactivating and reactivating, and changing
// fields and department.
export function UsersPage() {
  const user = useCurrentUser();

  return (
    <Page title="Users">
      {can(user, 'manageUsers') ? (
        <UserAdmin key={user.id} currentUserId={user.id} />
      ) : (
        <Paragraph>Only admins can manage users.</Paragraph>
      )}
    </Page>
  );
}

function UserAdmin({ currentUserId }: { currentUserId: string }) {
  const users = useUsers();
  const [isAdding, setIsAdding] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const editing = users.data?.find((candidate) => candidate.id === editingId);

  return (
    <>
      {editing && (
        // A fresh panel per user, so nothing from the previous user is kept.
        <EditUserPanel key={editing.id} user={editing} onClose={() => setEditingId(null)} />
      )}
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
        <UsersTable
          users={users.data}
          currentUserId={currentUserId}
          onDeactivated={(deactivated) =>
            setStatusMessage(`${deactivated.firstName} ${deactivated.surname} was deactivated.`)
          }
          onReactivated={(reactivated) =>
            setStatusMessage(`${reactivated.firstName} ${reactivated.surname} was reactivated.`)
          }
          onReactivateFailed={(failed, error) =>
            setStatusMessage(
              error instanceof ApiError && error.status === 403
                ? 'You are not allowed to reactivate users.'
                : `${failed.firstName} ${failed.surname} could not be reactivated. Try again.`,
            )
          }
          onEdit={(selected) => setEditingId(selected.id)}
        />
      )}
    </>
  );
}
