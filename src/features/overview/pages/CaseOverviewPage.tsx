import { Button, Paragraph, Spinner } from '@digdir/designsystemet-react';
import { useQuery } from '@tanstack/react-query';
import { Link as RouterLink } from 'react-router';
import { useCurrentUser } from '@/features/auth';
import { canCreateCases } from '@/features/cases';
import { Page } from '@/shared/components/Page';
import { caseOverviewQuery } from '../api';
import { CaseOverviewTable } from '../components/CaseOverviewTable';

// F-003 case overview: each role sees the cases the permission table allows. Filters come in T3.2.
export function CaseOverviewPage() {
  const user = useCurrentUser();
  const overview = useQuery(caseOverviewQuery);

  return (
    <Page title="Cases">
      {/* F-001: the button is only shown to users who may create cases. */}
      {canCreateCases(user) && (
        <Button asChild>
          <RouterLink to="/cases/new">New case</RouterLink>
        </Button>
      )}
      {overview.data?.some((row) => row.access === 'restricted') && (
        <Paragraph>
          You see these cases without sensitive data, so reactions are not shown.
        </Paragraph>
      )}
      {overview.isPending ? (
        <Spinner aria-label="Loading cases" />
      ) : overview.isError ? (
        <Paragraph>The cases could not be loaded. Try again.</Paragraph>
      ) : overview.data.length === 0 ? (
        <Paragraph>There are no cases to show yet.</Paragraph>
      ) : (
        <CaseOverviewTable rows={overview.data} />
      )}
    </Page>
  );
}
