import {
  Link,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from '@digdir/designsystemet-react';
import { Link as RouterLink } from 'react-router';
import { DEPARTMENT_NAMES, FIELD_LABELS } from '@/features/auth';
import { CASE_STATUS_LABELS, caseWorkerDisplayName, REACTION_LABELS } from '@/features/cases';
import type { OverviewRow } from '../types';
import styles from './CaseOverview.module.css';

interface CaseOverviewTableProps {
  rows: OverviewRow[];
}

// F-003: case number, field, status, assigned case worker and reactions. The reactions column is left
// out when no row has them (Admin's restricted rows, F-004). Admin, who sees cases from every
// department, gets a department column instead.
export function CaseOverviewTable({ rows }: CaseOverviewTableProps) {
  const showReactions = rows.some((row) => row.access === 'full');
  const showDepartment = rows.some((row) => row.access === 'restricted');

  return (
    // On narrow screens the table scrolls sideways inside this region instead of being cut off.
    // Every row has a link, so keyboard users reach (and scroll to) every row without extra focus stops.
    <div className={styles.tableScroll} role="region" aria-label="Cases table">
      <Table>
        <caption>{rows.length === 1 ? '1 case' : `${rows.length} cases`}</caption>
        <TableHead>
          <TableRow>
            <TableHeaderCell>Case number</TableHeaderCell>
            {showDepartment && <TableHeaderCell>Department</TableHeaderCell>}
            <TableHeaderCell>Field</TableHeaderCell>
            <TableHeaderCell>Status</TableHeaderCell>
            <TableHeaderCell>Case worker</TableHeaderCell>
            {showReactions && <TableHeaderCell>Reactions</TableHeaderCell>}
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.id}>
              <TableCell>
                <Link asChild>
                  <RouterLink to={`/cases/${row.id}`}>{row.caseNumber}</RouterLink>
                </Link>
              </TableCell>
              {showDepartment && <TableCell>{DEPARTMENT_NAMES[row.departmentId]}</TableCell>}
              <TableCell>{FIELD_LABELS[row.field]}</TableCell>
              <TableCell>{CASE_STATUS_LABELS[row.status]}</TableCell>
              <TableCell>{caseWorkerDisplayName(row.assignedCaseWorker)}</TableCell>
              {showReactions && (
                <TableCell>
                  {row.access === 'full' && row.reactions.length > 0
                    ? row.reactions.map((reaction) => REACTION_LABELS[reaction]).join(', ')
                    : '–'}
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
