import { Link, Paragraph } from '@digdir/designsystemet-react';
import { isRouteErrorResponse, Link as RouterLink, useRouteError } from 'react-router';
import { Page } from '@/shared/components/Page';
import { NotFoundPage } from './NotFoundPage';

// Shown inside the app shell when a page fails. Error details are never shown to the user,
// since they could contain case data (docs/conventions/security.md).
export function RouteErrorPage() {
  const error = useRouteError();
  if (isRouteErrorResponse(error) && error.status === 404) return <NotFoundPage />;

  return (
    <Page title="Something went wrong">
      <Paragraph>
        The page could not be shown. Try again, or go back to the case overview.
      </Paragraph>
      <Paragraph>
        <Link asChild>
          <RouterLink to="/">Go to the case overview</RouterLink>
        </Link>
      </Paragraph>
    </Page>
  );
}
