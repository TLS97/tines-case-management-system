import AxeBuilder from '@axe-core/playwright';
import { test as base, expect, type Page } from '@playwright/test';

interface ConsoleFixtures {
  /**
   * Console errors this test expects, for example the browser's own "Failed to load resource" line
   * when a test opens a case it may not see. Set with `test.use({ expectedConsoleErrors: [...] })`.
   */
  expectedConsoleErrors: RegExp[];
  consoleProblems: string[];
}

// Every e2e test fails on browser console errors or warnings (docs/conventions/definition-of-done.md),
// except errors the test declares as expected.
export const test = base.extend<ConsoleFixtures>({
  expectedConsoleErrors: [[], { option: true }],
  consoleProblems: [
    async ({ page, expectedConsoleErrors }, use) => {
      const problems: string[] = [];
      page.on('console', (message) => {
        const type = message.type();
        if (type !== 'error' && type !== 'warning') return;
        const text = message.text();
        if (type === 'error' && expectedConsoleErrors.some((pattern) => pattern.test(text))) return;
        problems.push(`${type}: ${text}`);
      });
      page.on('pageerror', (error) => problems.push(`page error: ${error.message}`));

      await use(problems);

      expect(problems, 'Browser console must have no errors or warnings').toEqual([]);
    },
    { auto: true },
  ],
});

/** The browser's console line for a request that was answered with this HTTP status. */
export function failedRequestLine(status: number): RegExp {
  return new RegExp(`Failed to load resource: the server responded with a status of ${status}\\b`);
}

export { expect };

// Opens a page and waits until the app has rendered. The app renders only after the mock API
// (service worker) has started, so this also makes the mock API ready for the test.
export async function gotoApp(page: Page, path: string) {
  await page.goto(path);
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
}

// Waits until fade-ins and other finite animations are done. Mid-animation colours are half
// transparent, so axe would report contrast problems that do not exist once the animation ends.
// Endless animations (spinners) are skipped, since they never finish.
async function waitForAnimationsToFinish(page: Page) {
  await page.evaluate(async () => {
    const finite = document
      .getAnimations()
      .filter((animation) => animation.effect?.getComputedTiming().endTime !== Infinity);
    await Promise.all(finite.map((animation) => animation.finished.catch(() => undefined)));
  });
}

// WCAG 2.1 AA, as required by docs/conventions/definition-of-done.md.
export async function expectNoAccessibilityViolations(page: Page) {
  await waitForAnimationsToFinish(page);
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze();

  expect(results.violations).toEqual([]);
}
