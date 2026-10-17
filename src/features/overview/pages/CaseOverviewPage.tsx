import { Button, Paragraph, Spinner } from '@digdir/designsystemet-react';
import { useQuery } from '@tanstack/react-query';
import { Link as RouterLink, useSearchParams } from 'react-router';
import { useCurrentUser } from '@/features/auth';
import { canCreateCases } from '@/features/cases';
import { Page } from '@/shared/components/Page';
import { caseOverviewQuery } from '../api';
import { CaseOverviewFilters } from '../components/CaseOverviewFilters';
import { CaseOverviewTable } from '../components/CaseOverviewTable';
import { FILTER_KEYS, filterRows, hasFilters, parseFilters } from '../filters';

// F-003 case overview: each role sees the cases the permission table allows, filtered by field,
// status and reaction. The filters live in the page address, so they survive a reload.
export function CaseOverviewPage() {
  const user = useCurrentUser();
  const overview = useQuery(caseOverviewQuery);
  const [searchParams, setSearchParams] = useSearchParams();

  const rows = overview.data ?? [];
  const showReactionFilter = rows.some((row) => row.access === 'full');
  const parsed = parseFilters(searchParams);
  // A reaction filter in the address is ignored when there is nothing to filter on (Admin).
  const filters = showReactionFilter ? parsed : { ...parsed, reaction: undefined };
  const filtered = filterRows(rows, filters);

  function changeFilter(key: (typeof FILTER_KEYS)[number], value: string) {
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
        for (const key of FILTER_KEYS) next.delete(key);
        return next;
      },
      { replace: true },
    );
  }

  return (
    <Page title="Cases">
      {/* F-001: the button is only shown to users who may create cases. */}
      {canCreateCases(user) && (
        <Button asChild>
          <RouterLink to="/cases/new">New case</RouterLink>
        </Button>
      )}
      {rows.some((row) => row.access === 'restricted') && (
        <Paragraph>
          You see these cases without sensitive data, so reactions are not shown.
        </Paragraph>
      )}
      {overview.isPending ? (
        <Spinner aria-label="Loading cases" />
      ) : overview.isError ? (
        <Paragraph>The cases could not be loaded. Try again.</Paragraph>
      ) : rows.length === 0 ? (
        <Paragraph>There are no cases to show yet.</Paragraph>
      ) : (
        <>
          <CaseOverviewFilters
            filters={filters}
            showReactionFilter={showReactionFilter}
            onChange={changeFilter}
            onClear={clearFilters}
          />
          <Paragraph role="status">
            {hasFilters(filters) ? `Showing ${filtered.length} of ${rows.length} cases.` : ''}
          </Paragraph>
          {filtered.length === 0 ? (
            <Paragraph>No cases match the filters.</Paragraph>
          ) : (
            <CaseOverviewTable rows={filtered} />
          )}
        </>
      )}
    </Page>
  );
}
