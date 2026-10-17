import { expect, expectNoAccessibilityViolations, gotoApp, test } from './fixtures';

test('the user switcher starts as Tine Tester and keeps the chosen user after a reload', async ({
  page,
}) => {
  await gotoApp(page, '/');
  const switcher = page.getByLabel('Acting as');
  await expect(switcher.locator('option:checked')).toHaveText('Tine Tester – Case worker');
  await expectNoAccessibilityViolations(page);

  await switcher.selectOption({ label: 'Lars Johansen – Admin' });
  await expect(switcher.locator('option:checked')).toHaveText('Lars Johansen – Admin');
  await expect(switcher).toBeEnabled();

  await page.reload();
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await expect(page.getByLabel('Acting as').locator('option:checked')).toHaveText(
    'Lars Johansen – Admin',
  );
});

test('Reset mock data switches back to Tine Tester', async ({ page }) => {
  await gotoApp(page, '/');
  const switcher = page.getByLabel('Acting as');
  await switcher.selectOption({ label: 'Kari Solberg – Leader' });
  await expect(switcher).toBeEnabled();

  await page.getByRole('button', { name: 'Reset mock data' }).click();
  await page
    .getByRole('dialog', { name: 'Reset mock data?' })
    .getByRole('button', { name: 'Reset' })
    .click();

  await expect(switcher.locator('option:checked')).toHaveText('Tine Tester – Case worker');
});

test('the user switcher fits on a small phone, so the page does not scroll sideways', async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 640 });
  await gotoApp(page, '/');

  const switcher = page.getByLabel('Acting as');
  const box = await switcher.boundingBox();
  expect(box && box.x + box.width).toBeLessThanOrEqual(320);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(320);
  await expectNoAccessibilityViolations(page);
});
