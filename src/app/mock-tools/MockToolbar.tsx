import { Paragraph } from '@digdir/designsystemet-react';
import styles from './MockToolbar.module.css';
import { ResetMockDataButton } from './ResetMockDataButton';
import { UserSwitcher } from './UserSwitcher';

// Mock-only tools above the header. v1 has no backend, so this bar is always shown.
export function MockToolbar() {
  return (
    <section aria-label="Test environment" className={styles.toolbar}>
      <div className={styles.inner}>
        <Paragraph data-size="sm">Test environment: all data is fake.</Paragraph>
        <div className={styles.tools}>
          <UserSwitcher />
          <ResetMockDataButton />
        </div>
      </div>
    </section>
  );
}
