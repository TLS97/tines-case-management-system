import { expect, expectNoAccessibilityViolations, gotoApp, test } from './fixtures';

test('F-001 a leader creates a case and lands on its page', async ({ page }) => {
  await gotoApp(page, '/');
  const switcher = page.getByLabel('Acting as');
  await switcher.selectOption({ label: 'Ingrid Halvorsen – Leader' });
  await expect(switcher).toBeEnabled();

  await page.getByRole('link', { name: 'New case' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'New case' })).toBeFocused();
  await expect(page.getByLabel('Field')).toHaveValue('Health');
  await expectNoAccessibilityViolations(page);

  await page.getByLabel('Field').selectOption({ label: 'Social' });
  await page.getByRole('button', { name: 'Create case' }).click();

  await expect(page).toHaveURL(/\/cases\/[0-9a-f-]{36}$/);
  await expect(page.getByRole('heading', { level: 1, name: 'Case details' })).toBeVisible();
  const cases = await page.evaluate(() => {
    const db = JSON.parse(localStorage.getItem('sak.mockDb') ?? '{}') as {
      cases: { caseNumber: string; field: string; status: string }[];
    };
    return db.cases;
  });
  expect(cases).toEqual([
    expect.objectContaining({ field: 'Social', status: 'Unassigned' }) as unknown,
  ]);
  expect(cases[0]?.caseNumber).toMatch(/^\d{4}\/0001$/);
});

test('F-001 a case worker sees no "New case" button', async ({ page }) => {
  await gotoApp(page, '/');

  await expect(page.getByLabel('Acting as').locator('option:checked')).toHaveText(
    'Tine Tester – Case worker',
  );
  await expect(page.getByRole('link', { name: 'New case' })).toHaveCount(0);
});
