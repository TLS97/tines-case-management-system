import type { Page } from '@playwright/test';
import { expect, expectNoAccessibilityViolations, gotoApp, test } from './fixtures';

const MAGNUS_ID = '1f166c34-2e8c-4b53-97ca-b1dd4f9e787c';
const OPEN_CASE = {
  id: 'ae6f4c50-0000-4000-8000-000000000201',
  caseNumber: '2026/0090',
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

test('F-004 moving a user is blocked until a leader has reassigned their open cases', async ({
  page,
}) => {
  await gotoApp(page, '/');
  await page.evaluate((supervisionCase) => {
    const db = JSON.parse(localStorage.getItem('sak.mockDb') ?? '{}') as { cases: unknown[] };
    db.cases.push(supervisionCase);
    localStorage.setItem('sak.mockDb', JSON.stringify(db));
  }, OPEN_CASE);

  // Admin tries to move Magnus Berg: his open case is listed instead.
  await actAs(page, 'Lars Johansen – Admin');
  await gotoApp(page, '/admin/users');
  await page.getByRole('button', { name: 'Edit Magnus Berg' }).click();
  const panel = page.getByRole('region', { name: 'Edit Magnus Berg' });
  await expect(panel.getByText(/A leader there must reassign them/)).toBeVisible();
  await expect(panel.getByRole('link', { name: '2026/0090' })).toBeVisible();
  await expectNoAccessibilityViolations(page);

  // Ingrid reassigns the case.
  await actAs(page, 'Ingrid Halvorsen – Leader');
  await gotoApp(page, `/cases/${OPEN_CASE.id}`);
  await page.getByLabel('Case worker').selectOption({ label: 'Nora Strand' });
  await page.getByRole('button', { name: 'Reassign' }).click();
  await expect(page.getByText('The case is assigned to Nora Strand.')).toBeVisible();

  // Now Admin can move him.
  await actAs(page, 'Lars Johansen – Admin');
  await gotoApp(page, '/admin/users');
  await page.getByRole('button', { name: 'Edit Magnus Berg' }).click();
  await panel
    .getByLabel('Move to', { exact: true })
    .selectOption({ label: 'Department of Business Management' });
  await expectNoAccessibilityViolations(page);
  await panel.getByRole('button', { name: 'Move Magnus Berg' }).click();
  await expect(
    panel.getByText('Magnus Berg is moved to the Department of Business Management.'),
  ).toBeVisible();
  await expect(page.getByRole('table').getByRole('row', { name: /Magnus Berg/ })).toContainText(
    'Department of Business Management',
  );
});
