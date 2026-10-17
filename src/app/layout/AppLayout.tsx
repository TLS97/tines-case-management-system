import { SkipLink, Spinner } from '@digdir/designsystemet-react';
import { Suspense, useEffect, useRef, type ReactNode, type RefObject } from 'react';
import { Outlet, useLocation } from 'react-router';
import { MockToolbar } from '../mock-tools/MockToolbar';
import { AppHeader } from './AppHeader';
import styles from './AppLayout.module.css';

export const MAIN_CONTENT_ID = 'main-content';

interface AppLayoutProps {
  // Only for error pages that replace the whole route tree; normally the matched page renders in <Outlet />.
  children?: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const mainRef = useRef<HTMLElement>(null);
  useFocusHeadingOnNavigation(mainRef);

  return (
    <>
      <SkipLink href={`#${MAIN_CONTENT_ID}`}>Skip to main content</SkipLink>
      <MockToolbar />
      <AppHeader />
      <main id={MAIN_CONTENT_ID} ref={mainRef} tabIndex={-1} className={styles.main}>
        {/* Pages that need data (for example the current user) wait here while it loads. */}
        <Suspense fallback={<Spinner aria-label="Loading" />}>{children ?? <Outlet />}</Suspense>
      </main>
    </>
  );
}

// After client-side navigation the browser keeps focus on the clicked link, so keyboard and
// screen reader users would not notice the new page. Move focus to the new page's h1 instead.
function useFocusHeadingOnNavigation(mainRef: RefObject<HTMLElement | null>) {
  const { pathname } = useLocation();
  const previousPathname = useRef(pathname);

  useEffect(() => {
    if (previousPathname.current === pathname) return;
    previousPathname.current = pathname;
    mainRef.current?.querySelector<HTMLElement>('h1')?.focus();
  }, [pathname, mainRef]);
}
