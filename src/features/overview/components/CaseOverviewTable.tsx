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
import { FIELD_LABELS } from '@/features/auth';
import { CASE_STATUS_LABELS, caseWorkerDisplayName, REACTION_LABELS } from '@/features/cases';
import type { OverviewRow } from '../types';

interface CaseOverviewTableProps {
  rows: OverviewRow[];
}

// F-003: case number, field, status, assigned case worker and reactions. The reactions column is left
// out when no row has them (Admin's restricted rows, F-004).
export function CaseOverviewTable({ rows }: CaseOverviewTableProps) {
  const showReactions = rows.some((row) => row.access === 'full');

  return (
    <Table>
      <caption>{rows.length === 1 ? '1 case' : `${rows.length} cases`}</caption>
      <TableHead>
        <TableRow>
          <TableHeaderCell>Case number</TableHeaderCell>
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
  );
}
