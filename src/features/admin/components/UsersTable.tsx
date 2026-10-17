import {
  Button,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from '@digdir/designsystemet-react';
import { DEPARTMENT_NAMES, FIELD_LABELS, ROLE_LABELS, type User } from '@/features/auth';
import { DeactivateUserButton } from './DeactivateUserButton';
import { ReactivateUserButton } from './ReactivateUserButton';
import styles from './UserAdmin.module.css';

interface UsersTableProps {
  users: User[];
  /** The admin using the page, who cannot deactivate themselves. */
  currentUserId: string;
  onDeactivated: (user: User) => void;
  onReactivated: (user: User) => void;
  onReactivateFailed: (user: User, error: Error) => void;
  onEdit: (user: User) => void;
}

// F-004: every user, sorted by department, then surname and first name.
export function UsersTable({
  users,
  currentUserId,
  onDeactivated,
  onReactivated,
  onReactivateFailed,
  onEdit,
}: UsersTableProps) {
  const sorted = [...users].sort(
    (a, b) =>
      a.departmentId - b.departmentId ||
      a.surname.localeCompare(b.surname, 'nb') ||
      a.firstName.localeCompare(b.firstName, 'nb'),
  );

  return (
    <div className={styles.tableScroll} role="region" aria-label="Users table">
      <Table>
        <caption>{users.length === 1 ? '1 user' : `${users.length} users`}</caption>
        <TableHead>
          <TableRow>
            <TableHeaderCell>Name</TableHeaderCell>
            <TableHeaderCell>Email</TableHeaderCell>
            <TableHeaderCell>Role</TableHeaderCell>
            <TableHeaderCell>Department</TableHeaderCell>
            <TableHeaderCell>Fields</TableHeaderCell>
            <TableHeaderCell>Status</TableHeaderCell>
            <TableHeaderCell>
              <span className={styles.visuallyHidden}>Actions</span>
            </TableHeaderCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {sorted.map((user) => (
            <TableRow key={user.id}>
              <TableCell>
                {user.firstName} {user.surname}
              </TableCell>
              <TableCell>{user.email}</TableCell>
              <TableCell>{ROLE_LABELS[user.role]}</TableCell>
              <TableCell>{DEPARTMENT_NAMES[user.departmentId]}</TableCell>
              <TableCell>
                {user.fields
                  .map((field) =>
                    field === user.primaryField
                      ? `${FIELD_LABELS[field]} (primary)`
                      : FIELD_LABELS[field],
                  )
                  .join(', ')}
              </TableCell>
              <TableCell>{user.isActive ? 'Active' : 'Deactivated'}</TableCell>
              <TableCell>
                <div className={styles.rowActions}>
                  <Button
                    variant="tertiary"
                    data-size="sm"
                    aria-label={`Edit ${user.firstName} ${user.surname}`}
                    onClick={() => onEdit(user)}
                  >
                    Edit
                  </Button>
                  {user.isActive && user.id !== currentUserId && (
                    <DeactivateUserButton user={user} onDeactivated={onDeactivated} />
                  )}
                  {!user.isActive && (
                    <ReactivateUserButton
                      user={user}
                      onReactivated={onReactivated}
                      onFailed={onReactivateFailed}
                    />
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
