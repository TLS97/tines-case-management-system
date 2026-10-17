import { Button, Paragraph } from '@digdir/designsystemet-react';
import { Link as RouterLink } from 'react-router';
import { useCurrentUser } from '@/features/auth';
import { canCreateCases } from '@/features/cases';
import { Page } from '@/shared/components/Page';

// The overview table and filters come with F-003.
export function CaseOverviewPage() {
  const user = useCurrentUser();

  return (
    <Page title="Cases">
      {/* F-001: the button is only shown to users who may create cases. */}
      {canCreateCases(user) && (
        <Button asChild>
          <RouterLink to="/cases/new">New case</RouterLink>
        </Button>
      )}
      <Paragraph>The case overview will be shown here.</Paragraph>
    </Page>
  );
}
