import { Paragraph } from '@digdir/designsystemet-react';
import { Page } from '@/shared/components/Page';

// Empty page; the global audit log comes with F-005.
export function AuditLogPage() {
  return (
    <Page title="Audit log">
      <Paragraph>The audit log will be shown here.</Paragraph>
    </Page>
  );
}
