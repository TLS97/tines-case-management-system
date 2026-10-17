import type { Page } from '@playwright/test';
import { expect, expectNoAccessibilityViolations, gotoApp, test } from './fixtures';

// Phase 2 "done when" (BUILD_PLAN.md): a leader creates and assigns a case, the case worker expands
// and closes it, the leader reopens it, data survives a reload, and every action is in the audit log.

async function actAs(page: Page, label: string) {
  const switcher = page.getByLabel('Acting as');
  await switcher.selectOption({ label });
  await expect(switcher).toBeEnabled();
}

const summary = (page: Page, label: string) =>
  page.locator('dt', { hasText: label }).locator('+ dd');

test('the whole case flow: create, assign, expand, close, reopen', async ({ page }) => {
  // Leader creates and assigns.
  await gotoApp(page, '/');
  await actAs(page, 'Ingrid Halvorsen – Leader');
  await page.getByRole('link', { name: 'New case' }).click();
  await page.getByRole('button', { name: 'Create case' }).click();
  await page.getByLabel('Case worker').selectOption({ label: 'Magnus Berg' });
  await page.getByRole('button', { name: 'Assign' }).click();
  await expect(summary(page, 'Status')).toHaveText('Assigned');
  const caseUrl = page.url();

  // Case worker adds a company and gives it a reaction.
  await actAs(page, 'Magnus Berg – Case worker');
  await page.getByRole('button', { name: 'Add company' }).click();
  await page.getByLabel('Organization number').fill('900000333');
  await page.getByLabel('Name', { exact: true }).fill('Flow Clinic');
  await page.getByLabel('Street name').fill('Flow Street 1');
  await page.getByLabel('Zip code').fill('0101');
  await page.getByLabel('State').fill('Flow State');
  await page.getByLabel('Country').fill('Norway');
  await page.getByRole('button', { name: 'Add company' }).click();
  await expect(summary(page, 'Status')).toHaveText('In progress');
  await expect(page.getByText('Give a reaction to: Flow Clinic.')).toBeVisible();
  await page.getByLabel('Reaction for Flow Clinic').selectOption({ label: 'Self-assessment' });
  await page.getByRole('button', { name: 'Save reaction' }).click();
  await expect(page.getByText('Every health personnel and company has a reaction')).toBeVisible();

  // ... and closes it.
  await page.getByRole('button', { name: 'Close case' }).click();
  const dialog = page.getByRole('dialog', { name: /^Close case \d{4}\/\d{4}\?$/ });
  await expect(dialog).toBeVisible();
  await expectNoAccessibilityViolations(page);
  await dialog.getByRole('button', { name: 'Close case' }).click();
  await expect(page.getByText('The case is closed.')).toBeVisible();
  await expect(summary(page, 'Status')).toHaveText('Closed');
  await expect(page.getByRole('button', { name: 'Add company' })).toHaveCount(0);

  // Leader reopens.
  await actAs(page, 'Ingrid Halvorsen – Leader');
  await expectNoAccessibilityViolations(page);
  await page.getByRole('button', { name: 'Reopen case' }).click();
  await expect(summary(page, 'Status')).toHaveText('In progress');

  // The case worker can change the case again, and everything survives a reload.
  await actAs(page, 'Magnus Berg – Case worker');
  await page.goto(caseUrl);
  await expect(page.getByRole('button', { name: 'Add company' })).toBeVisible();
  await expect(page.getByRole('heading', { level: 3, name: 'Flow Clinic' })).toBeVisible();
  await expect(page.getByLabel('Reaction for Flow Clinic')).toHaveValue('SelfAssessment');

  // Every step is in the audit log, without the company's details or reaction.
  const log = await page.evaluate(() => {
    const db = JSON.parse(localStorage.getItem('sak.mockDb') ?? '{}') as {
      auditLog: { action: string; result: string }[];
    };
    return db.auditLog;
  });
  const successful = log.filter((entry) => entry.result === 'Success').map((entry) => entry.action);
  expect(successful).toEqual(
    expect.arrayContaining([
      'CaseCreated',
      'CaseAssigned',
      'CaseUpdated',
      'ReactionGiven',
      'StatusChanged',
      'CaseOpened',
    ]),
  );
  expect(log.filter((entry) => entry.action === 'StatusChanged')).toHaveLength(4);
  const raw = JSON.stringify(log);
  for (const value of ['900000333', 'Flow Clinic', 'Flow Street', 'SelfAssessment']) {
    expect(raw).not.toContain(value);
  }
});
