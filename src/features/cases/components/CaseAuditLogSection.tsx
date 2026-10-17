import { Heading, Paragraph, Spinner } from '@digdir/designsystemet-react';
import { useQuery } from '@tanstack/react-query';
import { AuditLogTable, caseAuditLogQuery } from '@/features/audit-log';
import { CASE_STATUS_LABELS } from '../labels';
import { caseStatusSchema, type SupervisionCase } from '../types';
import styles from './CaseDetail.module.css';

interface CaseAuditLogSectionProps {
  supervisionCase: SupervisionCase;
}

const statusLabel = (status: string) => {
  const parsed = caseStatusSchema.safeParse(status);
  return parsed.success ? CASE_STATUS_LABELS[parsed.data] : status;
};

// F-005: the audit log for this case, newest first. Only rendered when
// can(user, 'viewCaseAuditLog', case) (a leader of the case's department), who sees the full case, so
// health personnel and companies are named. Refreshed after every change made on this page.
export function CaseAuditLogSection({ supervisionCase }: CaseAuditLogSectionProps) {
  const log = useQuery(caseAuditLogQuery(supervisionCase.id));
  const partyNames = new Map<string, string>([
    ...supervisionCase.healthPersonnel.map(
      (person) => [person.id, `${person.firstName} ${person.surname}`] as const,
    ),
    ...supervisionCase.companies.map((company) => [company.id, company.name] as const),
  ]);

  return (
    <section className={styles.section} aria-labelledby="case-audit-log-heading">
      <Heading id="case-audit-log-heading" level={2} data-size="sm">
        Audit log
      </Heading>
      {log.isPending ? (
        <Spinner aria-label="Loading the audit log" />
      ) : log.isError ? (
        <Paragraph>The audit log could not be loaded. Try again.</Paragraph>
      ) : (
        <AuditLogTable
          log={log.data}
          label="Audit log for this case"
          showCase={false}
          names={{ status: statusLabel, party: (id) => partyNames.get(id) }}
        />
      )}
    </section>
  );
}
