import AxeBuilder from '@axe-core/playwright';
import { test as base, expect, type Page } from '@playwright/test';

// Every e2e test fails on browser console errors or warnings (docs/conventions/definition-of-done.md).
export const test = base.extend<{ consoleProblems: string[] }>({
  consoleProblems: [
    async ({ page }, use) => {
      const problems: string[] = [];
      page.on('console', (message) => {
        if (message.type() === 'error' || message.type() === 'warning') {
          problems.push(`${message.type()}: ${message.text()}`);
        }
      });
      page.on('pageerror', (error) => problems.push(`page error: ${error.message}`));

      await use(problems);

      expect(problems, 'Browser console must have no errors or warnings').toEqual([]);
    },
    { auto: true },
  ],
});

export { expect };

// Opens a page and waits until the app has rendered. The app renders only after the mock API
// (service worker) has started, so this also makes the mock API ready for the test.
export async function gotoApp(page: Page, path: string) {
  await page.goto(path);
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
}

// WCAG 2.1 AA, as required by docs/conventions/definition-of-done.md.
export async function expectNoAccessibilityViolations(page: Page) {
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze();

  expect(results.violations).toEqual([]);
}
