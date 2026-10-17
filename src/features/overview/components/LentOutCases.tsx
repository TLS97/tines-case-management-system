import { Heading, ListItem, ListUnordered, Paragraph } from '@digdir/designsystemet-react';
import { useQuery } from '@tanstack/react-query';
import { DEPARTMENT_NAMES } from '@/features/auth';
import { caseWorkerDisplayName } from '@/features/cases';
import { lentOutCasesQuery } from '../api';
import styles from './CaseOverview.module.css';

// F-004: shown on a leader's Cases page while their case workers are borrowed for cases (not closed) in
// other departments. Read-only, without links: the leader cannot open cases in other departments.
// Only rendered when can(user, 'seeLentOutCases').
export function LentOutCases() {
  const { data } = useQuery(lentOutCasesQuery);
  if (!data || data.length === 0) return null;

  return (
    <section className={styles.lentOut} aria-labelledby="lent-out-heading">
      <Heading id="lent-out-heading" level={2} data-size="xs">
        Lent out
      </Heading>
      <Paragraph>Your case workers on cases in other departments:</Paragraph>
      <ListUnordered>
        {data.map((lentOut) => (
          <ListItem key={lentOut.caseId}>
            {lentOut.caseNumber}, {DEPARTMENT_NAMES[lentOut.departmentId]}:{' '}
            {caseWorkerDisplayName(lentOut.caseWorker)}
          </ListItem>
        ))}
      </ListUnordered>
    </section>
  );
}
