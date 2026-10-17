import { screen, waitFor, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderRoute } from '@/test/renderRoute';
import { RootErrorPage } from './errors/RootErrorPage';
import { RouteErrorPage } from './errors/RouteErrorPage';
import { AppLayout } from './layout/AppLayout';

function Boom(): never {
  throw new Error('Secret case data that must not be shown');
}

describe('App routes', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it.each([
    ['/', 'Cases'],
    ['/cases/new', 'New case'],
    ['/cases/3f2b8c1e-0000-4000-8000-000000000000', 'Case not found'],
    ['/admin/users', 'Users'],
    ['/admin/audit', 'Audit log'],
  ])('shows the page for %s with heading and document title "%s"', async (path, title) => {
    renderRoute(path);

    expect(await screen.findByRole('heading', { level: 1, name: title })).toBeInTheDocument();
    await waitFor(() => expect(document.title).toBe(`${title} – Case management`));
  });

  it('shows "Page not found" inside the app shell for an unknown address', async () => {
    renderRoute('/does-not-exist');

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Page not found' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: 'Main' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Go to the case overview' })).toHaveAttribute(
      'href',
      '/',
    );
  });

  it('has a skip link to the main content', async () => {
    renderRoute('/');

    const skipLink = await screen.findByRole('link', { name: 'Skip to main content' });
    expect(skipLink).toHaveAttribute('href', '#main-content');
    expect(screen.getByRole('main')).toHaveAttribute('id', 'main-content');
  });
});

describe('Main navigation', () => {
  it('marks the current page', async () => {
    renderRoute('/admin/users');

    const nav = await screen.findByRole('navigation', { name: 'Main' });
    expect(within(nav).getByRole('link', { name: 'Users' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(within(nav).getByRole('link', { name: 'Cases' })).not.toHaveAttribute('aria-current');
  });

  it('navigates to the clicked page and moves focus to its heading', async () => {
    const { user } = renderRoute('/');
    const nav = await screen.findByRole('navigation', { name: 'Main' });

    await user.click(within(nav).getByRole('link', { name: 'Audit log' }));

    const heading = await screen.findByRole('heading', { level: 1, name: 'Audit log' });
    await waitFor(() => expect(heading).toHaveFocus());
  });

  it('does not move focus on the first page load', async () => {
    renderRoute('/');

    await screen.findByRole('heading', { level: 1, name: 'Cases' });
    expect(document.body).toHaveFocus();
  });
});

describe('Error pages', () => {
  it('shows a generic message inside the app shell when a page fails, without error details', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    renderRoute('/', [
      {
        Component: AppLayout,
        ErrorBoundary: RootErrorPage,
        children: [{ ErrorBoundary: RouteErrorPage, children: [{ path: '/', Component: Boom }] }],
      },
    ]);

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Something went wrong' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: 'Main' })).toBeInTheDocument();
    expect(screen.queryByText(/Secret case data/)).not.toBeInTheDocument();
  });

  it('falls back to the root error page when the error is not caught inside the shell', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    renderRoute('/', [
      {
        Component: AppLayout,
        ErrorBoundary: RootErrorPage,
        children: [{ path: '/', Component: Boom }],
      },
    ]);

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Something went wrong' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Skip to main content' })).toBeInTheDocument();
    expect(screen.queryByText(/Secret case data/)).not.toBeInTheDocument();
  });
});
