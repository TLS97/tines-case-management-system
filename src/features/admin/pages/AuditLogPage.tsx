import { Paragraph, Spinner } from '@digdir/designsystemet-react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router';
import {
  AUDIT_FILTER_KEYS,
  AuditLogTable,
  globalAuditLogQuery,
  hasAuditLogFilters,
  parseAuditLogFilters,
  type AuditLogFilters as Filters,
} from '@/features/audit-log';
import { can, useCurrentUser } from '@/features/auth';
import { CASE_STATUS_LABELS, caseStatusSchema } from '@/features/cases';
import { Page } from '@/shared/components/Page';
import { AuditLogFilters } from '../components/AuditLogFilters';
import { useUsers } from '../hooks/useUsers';

const statusLabel = (status: string) => {
  const parsed = caseStatusSchema.safeParse(status);
  return parsed.success ? CASE_STATUS_LABELS[parsed.data] : status;
};

// F-005 (T3.8): the whole audit log for Admin, newest first, filtered by case, action, user, result
// and date. The filters live in the page address, so they survive a reload. Admin never sees health
// personnel or company names here (sensitive case data).
export function AuditLogPage() {
  const user = useCurrentUser();

  return (
    <Page title="Audit log">
      {can(user, 'viewGlobalAuditLog') ? (
        <GlobalAuditLog key={user.id} />
      ) : (
        <Paragraph>Only admins can see the whole audit log.</Paragraph>
      )}
    </Page>
  );
}

function GlobalAuditLog() {
  const [searchParams, setSearchParams] = useSearchParams();
  const filters = parseAuditLogFilters(searchParams);
  // While new filters load, the previous entries stay, so the page does not jump.
  const log = useQuery({ ...globalAuditLogQuery(filters), placeholderData: keepPreviousData });
  const users = useUsers();

  function changeFilter(key: keyof Filters, value: string) {
    setSearchParams(
      (current) => {
        const next = new URLSearchParams(current);
        if (value) next.set(key, value);
        else next.delete(key);
        return next;
      },
      // Each change replaces the address, so Back leaves the page instead of undoing filters.
      { replace: true },
    );
  }

  function clearFilters() {
    setSearchParams(
      (current) => {
        const next = new URLSearchParams(current);
        for (const key of AUDIT_FILTER_KEYS) next.delete(key);
        return next;
      },
      { replace: true },
    );
  }

  const count = log.data?.entries.length ?? 0;

  return (
    <>
      <AuditLogFilters
        filters={filters}
        users={users.data ?? []}
        onChange={changeFilter}
        onClear={clearFilters}
      />
      <Paragraph role="status">
        {log.isSuccess && hasAuditLogFilters(filters)
          ? `${count === 1 ? '1 entry matches' : `${count} entries match`} the filters.`
          : ''}
      </Paragraph>
      {log.isPending ? (
        <Spinner aria-label="Loading the audit log" />
      ) : log.isError ? (
        <Paragraph>The audit log could not be loaded. Try again.</Paragraph>
      ) : count === 0 ? (
        <Paragraph>
          {hasAuditLogFilters(filters)
            ? 'No entries match the filters.'
            : 'The audit log is empty.'}
        </Paragraph>
      ) : (
        <AuditLogTable
          log={log.data}
          label="Audit log entries"
          showCase
          names={{ status: statusLabel }}
        />
      )}
    </>
  );
}
