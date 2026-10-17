import type { Page } from '@playwright/test';
import { expect, expectNoAccessibilityViolations, gotoApp, test } from './fixtures';

const SEEDED_CASE = {
  id: 'd4b8f6c0-0000-4000-8000-000000000501',
  caseNumber: '2026/0110',
  status: 'Unassigned',
  field: 'Health',
  departmentId: 1,
  assignedTo: null,
  readAccess: [],
  healthPersonnel: [],
  companies: [],
};

async function actAs(page: Page, label: string) {
  const switcher = page.getByLabel('Acting as');
  await switcher.selectOption({ label });
  await expect(switcher).toBeEnabled();
}

test('F-005 a leader sees the audit log for a case; Admin finds it in the global log', async ({
  page,
}) => {
  await gotoApp(page, '/');
  await page.evaluate((supervisionCase) => {
    const db = JSON.parse(localStorage.getItem('sak.mockDb') ?? '{}') as { cases: unknown[] };
    db.cases.push(supervisionCase);
    localStorage.setItem('sak.mockDb', JSON.stringify(db));
  }, SEEDED_CASE);

  // Ingrid opens and assigns the case; its audit log on the case page shows both.
  await actAs(page, 'Ingrid Halvorsen – Leader');
  await gotoApp(page, `/cases/${SEEDED_CASE.id}`);
  const caseLog = page.getByRole('region', { name: 'Audit log for this case' });
  await expect(caseLog.getByText('1 entry')).toBeVisible();
  await page.getByLabel('Case worker').selectOption({ label: 'Nora Strand' });
  await page.getByRole('button', { name: 'Assign' }).click();
  await expect(caseLog.getByText('3 entries')).toBeVisible();
  await expect(caseLog.getByRole('row', { name: /Case assigned/ })).toContainText('To Nora Strand');
  await expectNoAccessibilityViolations(page);

  // Lars (Admin) finds the same entries in the global log by case number.
  await gotoApp(page, '/');
  await actAs(page, 'Lars Johansen – Admin');
  await page
    .getByRole('navigation', { name: 'Main' })
    .getByRole('link', { name: 'Audit log' })
    .click();
  await expect(page.getByRole('heading', { level: 1, name: 'Audit log' })).toBeVisible();
  await page.getByLabel('Case', { exact: true }).fill('2026/0110');
  await page.getByLabel('Case', { exact: true }).press('Enter');
  await expect(page.getByText('3 entries match the filters.')).toBeVisible();
  await page.getByLabel('Action').selectOption({ label: 'Case assigned' });
  await expect(page.getByText('1 entry matches the filters.')).toBeVisible();
  const log = page.getByRole('region', { name: 'Audit log entries' });
  await expect(log.getByRole('row', { name: /Case assigned/ })).toContainText('Ingrid Halvorsen');
  await expectNoAccessibilityViolations(page);

  // The filters are in the address, so they survive a reload.
  await page.reload();
  await expect(page.getByText('1 entry matches the filters.')).toBeVisible();
});

test('F-005 on a phone, the audit log scrolls inside its own region and can be reached by keyboard', async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 800 });
  await gotoApp(page, '/');
  await actAs(page, 'Lars Johansen – Admin');
  await gotoApp(page, '/admin/audit');
  await expect(page.getByText('The audit log is empty.')).toBeVisible();

  // Something to show: a leader who tried to add a user.
  await page.evaluate(() => {
    const db = JSON.parse(localStorage.getItem('sak.mockDb') ?? '{}') as {
      auditLog: unknown[];
      users: { id: string; email: string }[];
    };
    const ingrid = db.users.find((u) => u.email === 'ingrid.halvorsen@example.com');
    db.auditLog.push({
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      userId: ingrid?.id,
      action: 'UserAdded',
      result: 'Denied',
      details: {},
    });
    localStorage.setItem('sak.mockDb', JSON.stringify(db));
  });
  await page.reload();
  const log = page.getByRole('region', { name: 'Audit log entries' });
  await expect(log).toHaveAttribute('tabindex', '0');
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(375);
  await expectNoAccessibilityViolations(page);
});
