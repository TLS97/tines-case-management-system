import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from '@digdir/designsystemet-react';
import { DEPARTMENT_NAMES, FIELD_LABELS, ROLE_LABELS, type User } from '@/features/auth';
import styles from './UserAdmin.module.css';

interface UsersTableProps {
  users: User[];
}

// F-004: every user, sorted by department, then surname and first name.
export function UsersTable({ users }: UsersTableProps) {
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
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
