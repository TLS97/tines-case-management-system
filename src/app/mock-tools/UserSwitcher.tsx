import { Label, Paragraph, Select, SelectOptgroup } from '@digdir/designsystemet-react';
import { useQuery } from '@tanstack/react-query';
import {
  currentUserQuery,
  DEPARTMENT_IDS,
  DEPARTMENT_NAMES,
  ROLE_LABELS,
  type User,
} from '@/features/auth';
import styles from './MockToolbar.module.css';
import { useMockUsers, useSwitchUser } from './mockToolsApi';

const SELECT_ID = 'mock-user-switcher';

// Mock only: choose which user the app acts as. The choice is saved by the mock API in
// localStorage, so it survives a reload; Reset mock data goes back to Tine Tester.
export function UserSwitcher() {
  const users = useMockUsers();
  // Not useCurrentUser(): the toolbar must not suspend or fail together with the page.
  const currentUser = useQuery(currentUserQuery);
  const switchUser = useSwitchUser();

  if (users.isError || currentUser.isError) {
    return <Paragraph data-size="sm">Could not load the users.</Paragraph>;
  }

  const isLoading = !users.data || !currentUser.data;

  return (
    <div className={styles.switcher}>
      <Label htmlFor={SELECT_ID} data-size="sm">
        Acting as
      </Label>
      <Select
        id={SELECT_ID}
        data-size="sm"
        width="auto"
        value={currentUser.data?.id ?? ''}
        disabled={isLoading || switchUser.isPending}
        onChange={(event) => switchUser.mutate(event.target.value)}
      >
        {isLoading ? (
          <option value="">Loading users…</option>
        ) : (
          DEPARTMENT_IDS.map((departmentId) => (
            <SelectOptgroup key={departmentId} label={DEPARTMENT_NAMES[departmentId]}>
              {users.data
                .filter((user) => user.departmentId === departmentId)
                .map((user) => (
                  <option key={user.id} value={user.id}>
                    {userOptionLabel(user)}
                  </option>
                ))}
            </SelectOptgroup>
          ))
        )}
      </Select>
    </div>
  );
}

function userOptionLabel(user: User): string {
  const label = `${user.firstName} ${user.surname} – ${ROLE_LABELS[user.role]}`;
  return user.isActive ? label : `${label} (deactivated)`;
}
