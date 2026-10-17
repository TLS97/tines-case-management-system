import { Link } from '@digdir/designsystemet-react';
import { useQuery } from '@tanstack/react-query';
import { NavLink, Link as RouterLink } from 'react-router';
import { can, currentUserQuery, type User } from '@/features/auth';
import { APP_NAME } from '@/shared/components/Page';
import styles from './AppLayout.module.css';

// F-004: links to pages a user may not use are hidden (the pages also say so, and the mock API
// refuses). Until the current user has loaded, only Cases is shown.
const NAV_ITEMS: { to: string; label: string; end: boolean; show: (user: User) => boolean }[] = [
  { to: '/', label: 'Cases', end: true, show: () => true },
  { to: '/admin/users', label: 'Users', end: false, show: (user) => can(user, 'manageUsers') },
  {
    to: '/admin/audit',
    label: 'Audit log',
    end: false,
    show: (user) => can(user, 'viewGlobalAuditLog'),
  },
];

export function AppHeader() {
  // Not useCurrentUser(): the header must not suspend or fail together with the page.
  const { data: user } = useQuery(currentUserQuery);
  const items = NAV_ITEMS.filter(
    (item) => item.to === '/' || (user !== undefined && item.show(user)),
  );

  return (
    <header className={styles.header}>
      <div className={styles.headerInner}>
        <Link asChild data-color="neutral" className={styles.appName}>
          <RouterLink to="/">{APP_NAME}</RouterLink>
        </Link>
        <nav aria-label="Main">
          <ul className={styles.navList}>
            {items.map((item) => (
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
