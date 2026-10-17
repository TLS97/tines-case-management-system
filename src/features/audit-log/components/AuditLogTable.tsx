import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from '@digdir/designsystemet-react';
import { useScrollableRegion } from '@/shared/hooks/useScrollableRegion';
import { formatDateTime } from '@/shared/utils/formatDate';
import { describeEntry, type AuditNames } from '../describeEntry';
import { AUDIT_ACTION_LABELS, AUDIT_RESULT_LABELS } from '../labels';
import type { AuditLogResponse } from '../types';
import styles from './AuditLogTable.module.css';

interface AuditLogTableProps {
  log: AuditLogResponse;
  /** Labels and party names; user names come from the log itself. */
  names: Omit<AuditNames, 'user'>;
  /** The global log shows which case each entry is about; the log for one case does not need to. */
  showCase: boolean;
  label: string;
}

// F-005: audit log entries, newest first, with who did what, when and whether it was allowed.
export function AuditLogTable({ log, names, showCase, label }: AuditLogTableProps) {
  const userNames = new Map(log.users.map((u) => [u.id, `${u.firstName} ${u.surname}`]));
  const caseNumbers = new Map(log.cases.map((c) => [c.id, c.caseNumber]));
  const allNames: AuditNames = { ...names, user: (id) => userNames.get(id) };
  const [setScrollRegion, scrollRegionTabIndex] = useScrollableRegion();

  return (
    // On narrow screens the table scrolls sideways inside this region instead of being cut off. The rows
    // have nothing to tab to, so the region itself can then be focused and scrolled with the arrow keys.
    <div
      ref={setScrollRegion}
      tabIndex={scrollRegionTabIndex}
      className={styles.tableScroll}
      role="region"
      aria-label={label}
    >
      <Table data-size="sm">
        <caption>{log.entries.length === 1 ? '1 entry' : `${log.entries.length} entries`}</caption>
        <TableHead>
          <TableRow>
            <TableHeaderCell>Time</TableHeaderCell>
            <TableHeaderCell>User</TableHeaderCell>
            <TableHeaderCell>Action</TableHeaderCell>
            {showCase && <TableHeaderCell>Case</TableHeaderCell>}
            <TableHeaderCell>Result</TableHeaderCell>
            <TableHeaderCell>Details</TableHeaderCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {log.entries.map((entry) => (
            <TableRow key={entry.id}>
              <TableCell className={styles.noWrap}>{formatDateTime(entry.timestamp)}</TableCell>
              <TableCell>{userNames.get(entry.userId) ?? 'Unknown user'}</TableCell>
              <TableCell>{AUDIT_ACTION_LABELS[entry.action]}</TableCell>
              {showCase && (
                <TableCell className={styles.noWrap}>
                  {entry.caseId ? (caseNumbers.get(entry.caseId) ?? 'Unknown case') : '–'}
                </TableCell>
              )}
              <TableCell>{AUDIT_RESULT_LABELS[entry.result]}</TableCell>
              <TableCell>{describeEntry(entry, allNames) || '–'}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
