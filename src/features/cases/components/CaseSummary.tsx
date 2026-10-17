import { DEPARTMENT_NAMES, FIELD_LABELS } from '@/features/auth';
import { caseWorkerDisplayName, type CaseWorkerSummary } from '../caseResponse';
import { CASE_STATUS_LABELS } from '../labels';
import type { RestrictedSupervisionCase } from '../restrictedView';
import styles from './CaseDetail.module.css';

interface CaseSummaryProps {
  // Only the fields every viewer may see, so the same summary works for the restricted view.
  supervisionCase: RestrictedSupervisionCase;
  assignedCaseWorker: CaseWorkerSummary | null;
}

export function CaseSummary({ supervisionCase, assignedCaseWorker }: CaseSummaryProps) {
  return (
    <dl className={styles.summary}>
      <dt>Case number</dt>
      <dd>{supervisionCase.caseNumber}</dd>
      <dt>Status</dt>
      <dd>{CASE_STATUS_LABELS[supervisionCase.status]}</dd>
      <dt>Field</dt>
      <dd>{FIELD_LABELS[supervisionCase.field]}</dd>
      <dt>Department</dt>
      <dd>{DEPARTMENT_NAMES[supervisionCase.departmentId]}</dd>
      <dt>Case worker</dt>
      <dd>{caseWorkerDisplayName(assignedCaseWorker)}</dd>
    </dl>
  );
}
