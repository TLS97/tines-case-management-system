import { expect, expectNoAccessibilityViolations, gotoApp, test } from './fixtures';

test('F-004 a leader creates a case and assigns it to a case worker', async ({ page }) => {
  await gotoApp(page, '/');
  const switcher = page.getByLabel('Acting as');
  await switcher.selectOption({ label: 'Ingrid Halvorsen – Leader' });
  await expect(switcher).toBeEnabled();
  await page.getByRole('link', { name: 'New case' }).click();
  await page.getByRole('button', { name: 'Create case' }).click();

  const main = page.getByRole('main');
  await expect(page.getByRole('heading', { level: 2, name: 'Assign case' })).toBeVisible();
  await expect(main.getByText('Unassigned')).toBeVisible();
  await expectNoAccessibilityViolations(page);

  await page.getByLabel('Case worker').selectOption({ label: 'Magnus Berg' });
  await page.getByRole('button', { name: 'Assign' }).click();

  await expect(page.getByText('The case is assigned to Magnus Berg.')).toBeVisible();
  await expect(main.locator('dd').filter({ hasText: 'Magnus Berg' })).toBeVisible();
  await expect(main.locator('dd').filter({ hasText: /^Assigned$/ })).toBeVisible();
  await expect(page.getByRole('heading', { level: 2, name: 'Reassign case' })).toBeVisible();
  await expectNoAccessibilityViolations(page);

  // Magnus now sees the case, without the Assign section.
  await switcher.selectOption({ label: 'Magnus Berg – Case worker' });
  await expect(main.locator('dd').filter({ hasText: 'Magnus Berg' })).toBeVisible();
  await expect(page.getByRole('heading', { name: /assign case/i })).toHaveCount(0);
});
