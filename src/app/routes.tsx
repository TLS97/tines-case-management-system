import type { RouteObject } from 'react-router';
import { AuditLogPage, UsersPage } from '@/features/admin';
import { CaseDetailPage, NewCasePage } from '@/features/cases';
import { CaseOverviewPage } from '@/features/overview';
import { NotFoundPage } from './errors/NotFoundPage';
import { RootErrorPage } from './errors/RootErrorPage';
import { RouteErrorPage } from './errors/RouteErrorPage';
import { AppLayout } from './layout/AppLayout';

// Routes from docs/architecture.md. Page errors are caught inside the shell, so the header stays.
export const routes: RouteObject[] = [
  {
    Component: AppLayout,
    ErrorBoundary: RootErrorPage,
    children: [
      {
        ErrorBoundary: RouteErrorPage,
        children: [
          { path: '/', Component: CaseOverviewPage },
          { path: '/cases/new', Component: NewCasePage },
          { path: '/cases/:id', Component: CaseDetailPage },
          { path: '/admin/users', Component: UsersPage },
          { path: '/admin/audit', Component: AuditLogPage },
          { path: '*', Component: NotFoundPage },
        ],
      },
    ],
  },
];
