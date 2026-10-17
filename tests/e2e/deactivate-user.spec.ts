import type { Page } from '@playwright/test';
import { expect, expectNoAccessibilityViolations, gotoApp, test } from './fixtures';

const MAGNUS_ID = '1f166c34-2e8c-4b53-97ca-b1dd4f9e787c';
const SEEDED_CASE = {
  id: '9d5f3b40-0000-4000-8000-000000000101',
  caseNumber: '2026/0080',
  status: 'InProgress',
  field: 'Health',
  departmentId: 1,
  assignedTo: MAGNUS_ID,
  readAccess: [],
  healthPersonnel: [],
  companies: [],
};

async function actAs(page: Page, label: string) {
  const switcher = page.getByLabel('Acting as');
  await switcher.selectOption({ label });
  await expect(switcher).toBeEnabled();
}

test('F-004 deactivating a case worker: the leader is told and reassigns the case', async ({
  page,
}) => {
  await gotoApp(page, '/');
  await page.evaluate((supervisionCase) => {
    const db = JSON.parse(localStorage.getItem('sak.mockDb') ?? '{}') as { cases: unknown[] };
    db.cases.push(supervisionCase);
    localStorage.setItem('sak.mockDb', JSON.stringify(db));
  }, SEEDED_CASE);

  // Admin deactivates Magnus Berg.
  await actAs(page, 'Lars Johansen – Admin');
  await gotoApp(page, '/admin/users');
  await page.getByRole('button', { name: 'Deactivate Magnus Berg' }).click();
  const dialog = page.getByRole('dialog', { name: 'Deactivate Magnus Berg?' });
  await expect(dialog).toBeVisible();
  await expectNoAccessibilityViolations(page);
  await dialog.getByRole('button', { name: 'Deactivate' }).click();
  await expect(page.getByText('Magnus Berg was deactivated.')).toBeVisible();

  // Ingrid sees the notice at the top of her Cases page.
  await actAs(page, 'Ingrid Halvorsen – Leader');
  await gotoApp(page, '/');
  const notice = page.getByRole('heading', {
    level: 2,
    name: '1 case has a deactivated case worker',
  });
  await expect(notice).toBeVisible();
  await expect(page.getByRole('table')).toContainText('Magnus Berg (deactivated)');
  await expectNoAccessibilityViolations(page);

  // She opens the case and reassigns it; the notice is gone.
  await page.getByRole('link', { name: '2026/0080' }).first().click();
  await page.getByLabel('Case worker').selectOption({ label: 'Nora Strand' });
  await page.getByRole('button', { name: 'Reassign' }).click();
  await expect(page.getByText('The case is assigned to Nora Strand.')).toBeVisible();
  await page.getByRole('navigation', { name: 'Main' }).getByRole('link', { name: 'Cases' }).click();
  await expect(page.getByRole('table')).toContainText('Nora Strand');
  await expect(notice).toHaveCount(0);
});
