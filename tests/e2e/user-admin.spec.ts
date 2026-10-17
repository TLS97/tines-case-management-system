import { expect, expectNoAccessibilityViolations, gotoApp, test } from './fixtures';

test('F-004 Admin adds a user, who can then be chosen in the switcher', async ({ page }) => {
  await gotoApp(page, '/');
  const switcher = page.getByLabel('Acting as');
  await switcher.selectOption({ label: 'Lars Johansen – Admin' });
  await expect(switcher).toBeEnabled();
  await page.getByRole('navigation', { name: 'Main' }).getByRole('link', { name: 'Users' }).click();

  const table = page.getByRole('table');
  await expect(table.getByText('19 users')).toBeVisible();
  await expectNoAccessibilityViolations(page);

  await page.getByRole('button', { name: 'Add user' }).click();
  await page.getByLabel('First name').fill('Nina');
  await page.getByLabel('Surname').fill('Newcomer');
  await page.getByLabel('Email').fill('nina.newcomer@example.com');
  await page.getByLabel('Role').selectOption({ label: 'Leader' });
  await page.getByLabel('Department').selectOption({ label: 'Department of Child Welfare' });
  await page.getByLabel('Primary field').selectOption({ label: 'Child services' });
  await page.getByLabel('Social').check();
  await expectNoAccessibilityViolations(page);
  await page.getByRole('button', { name: 'Add user' }).click();

  await expect(page.getByText('Nina Newcomer was added.')).toBeVisible();
  await expect(table.getByText('20 users')).toBeVisible();
  await switcher.selectOption({ label: 'Nina Newcomer – Leader' });
  await expect(switcher).toBeEnabled();
  // Nina is a leader, so she sees Cases but not Users.
  await expect(page.getByText('Only admins can manage users.')).toBeVisible();
});

test('F-004 a case worker sees only Cases in the navigation', async ({ page }) => {
  await gotoApp(page, '/');

  await expect(page.getByRole('navigation', { name: 'Main' }).getByRole('link')).toHaveText([
    'Cases',
  ]);
});
