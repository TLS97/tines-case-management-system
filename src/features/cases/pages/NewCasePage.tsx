import { Paragraph } from '@digdir/designsystemet-react';
import { useCurrentUser } from '@/features/auth';
import { Page } from '@/shared/components/Page';
import { canCreateCases } from '../canCreateCases';
import { NewCaseForm } from '../components/NewCaseForm';

// F-001 Create supervision case.
export function NewCasePage() {
  const user = useCurrentUser();

  return (
    <Page title="New case">
      {canCreateCases(user) ? (
        // A new form per user, so switching user (mock) never keeps the previous user's choice.
        <NewCaseForm key={user.id} user={user} />
      ) : (
        <Paragraph>Only leaders can create cases.</Paragraph>
      )}
    </Page>
  );
}
