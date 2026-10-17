import { Paragraph } from '@digdir/designsystemet-react';
import { Page } from '@/shared/components/Page';

// Empty page; the new case form comes with F-001.
export function NewCasePage() {
  return (
    <Page title="New case">
      <Paragraph>The form for creating a case will be shown here.</Paragraph>
    </Page>
  );
}
