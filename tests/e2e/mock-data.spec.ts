import type { Page } from '@playwright/test';
import { expect, expectNoAccessibilityViolations, gotoApp, test } from './fixtures';

const STORAGE_KEY = 'sak.mockDb';

interface StoredUser {
  id: string;
  surname: string;
}

// Reads users through the mock API (the service worker), as the app does.
async function fetchUsers(page: Page): Promise<StoredUser[]> {
  return page.evaluate(async () => {
    const response = await fetch('/api/mock/users');
    return (await response.json()) as StoredUser[];
  });
}

async function renameFirstStoredUser(page: Page, surname: string) {
  await page.evaluate(
    ({ key, newSurname }) => {
      const db = JSON.parse(localStorage.getItem(key) ?? '{}') as { users: StoredUser[] };
      const [first] = db.users;
      if (first) first.surname = newSurname;
      localStorage.setItem(key, JSON.stringify(db));
    },
    { key: STORAGE_KEY, newSurname: surname },
  );
}

test('the first visit loads the 19 seed users into localStorage', async ({ page }) => {
  await gotoApp(page, '/');

  const users = await fetchUsers(page);
  expect(users).toHaveLength(19);
  const stored = await page.evaluate((key) => localStorage.getItem(key), STORAGE_KEY);
  expect(stored).not.toBeNull();
});

test('changes to the mock data survive a reload', async ({ page }) => {
  await gotoApp(page, '/');
  await fetchUsers(page);
  await renameFirstStoredUser(page, 'Changed');

  await page.reload();
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

  expect((await fetchUsers(page))[0]?.surname).toBe('Changed');
});

test('Reset mock data asks for confirmation and restores the seed data', async ({ page }) => {
  await gotoApp(page, '/');
  const [seedFirst] = await fetchUsers(page);
  await renameFirstStoredUser(page, 'Changed');

  await page.getByRole('button', { name: 'Reset mock data' }).click();
  const dialog = page.getByRole('dialog', { name: 'Reset mock data?' });
  await expect(dialog).toBeVisible();
  await expectNoAccessibilityViolations(page);
  await dialog.getByRole('button', { name: 'Reset' }).click();

  await expect(page.getByRole('status')).toHaveText('Mock data has been reset.');
  await expect(dialog).toBeHidden();
  expect((await fetchUsers(page))[0]?.surname).toBe(seedFirst?.surname);
});
