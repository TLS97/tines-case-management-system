import { Link, Paragraph } from '@digdir/designsystemet-react';
import { Link as RouterLink } from 'react-router';
import { Page } from '@/shared/components/Page';

export function NotFoundPage() {
  return (
    <Page title="Page not found">
      <Paragraph>The page you are looking for does not exist.</Paragraph>
      <Paragraph>
        <Link asChild>
          <RouterLink to="/">Go to the case overview</RouterLink>
        </Link>
      </Paragraph>
    </Page>
  );
}
