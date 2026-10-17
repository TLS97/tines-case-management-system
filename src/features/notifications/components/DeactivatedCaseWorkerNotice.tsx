import {
  Alert,
  Heading,
  Link,
  ListItem,
  ListUnordered,
  Paragraph,
} from '@digdir/designsystemet-react';
import { useQuery } from '@tanstack/react-query';
import { Link as RouterLink } from 'react-router';
import { caseWorkerDisplayName } from '@/features/cases';
import { notificationsQuery } from '../api';
import styles from './Notifications.module.css';

// F-004: shown at the top of a leader's Cases page while cases in their department (not closed) have a
// deactivated case worker. Each case links to its page, where the leader can reassign it; the case then
// drops off this list.
export function DeactivatedCaseWorkerNotice() {
  const { data } = useQuery(notificationsQuery);
  const cases = (data ?? []).filter((n) => n.type === 'DeactivatedCaseWorker');
  if (cases.length === 0) return null;

  return (
    <Alert data-color="warning" className={styles.notice}>
      <Heading level={2} data-size="xs">
        {cases.length === 1
          ? '1 case has a deactivated case worker'
          : `${cases.length} cases have a deactivated case worker`}
      </Heading>
      <Paragraph>Reassign them to an active case worker.</Paragraph>
      <ListUnordered>
        {cases.map((notification) => (
          <ListItem key={notification.caseId}>
            <Link asChild>
              <RouterLink to={`/cases/${notification.caseId}`}>
                {notification.caseNumber}
              </RouterLink>
            </Link>{' '}
            – {caseWorkerDisplayName(notification.caseWorker)}
          </ListItem>
        ))}
      </ListUnordered>
    </Alert>
  );
}
