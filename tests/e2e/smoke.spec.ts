import { expect, expectNoAccessibilityViolations, test } from './fixtures';

test('app loads with its heading and no accessibility violations', async ({ page }) => {
  await page.goto('/');

  await expect(
    page.getByRole('heading', { level: 1, name: 'Supervision case management' }),
  ).toBeVisible();
  await expectNoAccessibilityViolations(page);
});
