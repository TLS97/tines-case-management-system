import { Link } from '@digdir/designsystemet-react';
import { NavLink, Link as RouterLink } from 'react-router';
import { APP_NAME } from '@/shared/components/Page';
import styles from './AppLayout.module.css';

// Shown to everyone for now; hiding links by role comes with can() (F-004).
const NAV_ITEMS = [
  { to: '/', label: 'Cases', end: true },
  { to: '/admin/users', label: 'Users', end: false },
  { to: '/admin/audit', label: 'Audit log', end: false },
] as const;

export function AppHeader() {
  return (
    <header className={styles.header}>
      <div className={styles.headerInner}>
        <Link asChild data-color="neutral" className={styles.appName}>
          <RouterLink to="/">{APP_NAME}</RouterLink>
        </Link>
        <nav aria-label="Main">
          <ul className={styles.navList}>
            {NAV_ITEMS.map((item) => (
              <li key={item.to}>
                <Link asChild>
                  <NavLink to={item.to} end={item.end}>
                    {item.label}
                  </NavLink>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </header>
  );
}
