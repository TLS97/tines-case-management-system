import { expect, expectNoAccessibilityViolations, gotoApp, test } from './fixtures';

const PAGES = [
  { path: '/', title: 'Cases' },
  { path: '/cases/new', title: 'New case' },
  { path: '/cases/3f2b8c1e-0000-4000-8000-000000000000', title: 'Case details' },
  { path: '/admin/users', title: 'Users' },
  { path: '/admin/audit', title: 'Audit log' },
  { path: '/does-not-exist', title: 'Page not found' },
];

for (const { path, title } of PAGES) {
  test(`${path} shows "${title}" with no accessibility violations`, async ({ page }) => {
    await gotoApp(page, path);

    await expect(page.getByRole('heading', { level: 1, name: title })).toBeVisible();
    await expect(page).toHaveTitle(`${title} – Case management`);
    await expectNoAccessibilityViolations(page);
  });
}

test('main navigation moves between pages and focuses the new heading', async ({ page }) => {
  await gotoApp(page, '/');
  const nav = page.getByRole('navigation', { name: 'Main' });

  await nav.getByRole('link', { name: 'Users' }).click();

  await expect(page).toHaveURL('/admin/users');
  await expect(page.getByRole('heading', { level: 1, name: 'Users' })).toBeFocused();
  await expect(nav.getByRole('link', { name: 'Users' })).toHaveAttribute('aria-current', 'page');
});

test('skip link is the first thing keyboard users reach and jumps to the main content', async ({
  page,
}) => {
  await gotoApp(page, '/');

  await page.keyboard.press('Tab');
  const skipLink = page.getByRole('link', { name: 'Skip to main content' });
  await expect(skipLink).toBeFocused();
  await expect(skipLink).toBeVisible();

  await page.keyboard.press('Enter');
  await expect(page.getByRole('main')).toBeFocused();
});
