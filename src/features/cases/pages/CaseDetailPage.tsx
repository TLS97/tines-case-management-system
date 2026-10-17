import { Paragraph } from '@digdir/designsystemet-react';
import { Page } from '@/shared/components/Page';

// Empty page; the case details come with F-002.
export function CaseDetailPage() {
  return (
    <Page title="Case details">
      <Paragraph>The details of the case will be shown here.</Paragraph>
    </Page>
  );
}
