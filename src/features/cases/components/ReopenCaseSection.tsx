import { Alert, Button, Heading, Paragraph } from '@digdir/designsystemet-react';
import { useReopenCase } from '../hooks/useEditCase';
import styles from './CaseDetail.module.css';
import { editErrorMessage } from './editErrorMessage';

interface ReopenCaseSectionProps {
  caseId: string;
  onReopened: () => void;
}

// F-004: a leader reopens a closed case in their department; it becomes In progress.
export function ReopenCaseSection({ caseId, onReopened }: ReopenCaseSectionProps) {
  const reopen = useReopenCase(caseId);

  return (
    <section className={styles.section} aria-labelledby="reopen-case-heading">
      <Heading id="reopen-case-heading" level={2} data-size="sm">
        Reopen case
      </Heading>
      <Paragraph>Reopen the case so the case worker can change it again.</Paragraph>
      {reopen.isError && (
        <Alert data-color="danger">
          {editErrorMessage(reopen.error, 'The case could not be reopened. Try again.')}
        </Alert>
      )}
      <div>
        <Button
          variant="secondary"
          loading={reopen.isPending}
          onClick={() => reopen.mutate(undefined, { onSuccess: onReopened })}
        >
          Reopen case
        </Button>
      </div>
    </section>
  );
}
