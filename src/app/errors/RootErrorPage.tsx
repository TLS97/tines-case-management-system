import { AppLayout } from '../layout/AppLayout';
import { RouteErrorPage } from './RouteErrorPage';

// Last resort when the app shell itself fails: render the shell again around the error message.
// If the shell keeps failing, React Router's own fallback takes over.
export function RootErrorPage() {
  return (
    <AppLayout>
      <RouteErrorPage />
    </AppLayout>
  );
}
