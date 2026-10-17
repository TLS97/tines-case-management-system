import { Heading } from '@digdir/designsystemet-react';
import type { ReactNode } from 'react';
import styles from './Page.module.css';

export const APP_NAME = 'Case management';

interface PageProps {
  title: string;
  children?: ReactNode;
}

// Every page has a unique document title (WCAG 2.4.2) and one h1. The h1 can take focus,
// so the app shell can move focus to it after client-side navigation.
export function Page({ title, children }: PageProps) {
  return (
    <div className={styles.page}>
      <title>{`${title} – ${APP_NAME}`}</title>
      <Heading level={1} data-size="lg" tabIndex={-1}>
        {title}
      </Heading>
      {children}
    </div>
  );
}
