import type { Page } from '@playwright/test';
import { expect, expectNoAccessibilityViolations, gotoApp, test } from './fixtures';

const UNASSIGNED_CASE = {
  id: 'c3a9e5b0-0000-4000-8000-000000000401',
  caseNumber: '2026/0100',
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

test('F-004 a leader borrows a case worker from another department; their leader sees it under "Lent out"', async ({
  page,
}) => {
  await gotoApp(page, '/');
  await page.evaluate((supervisionCase) => {
    const db = JSON.parse(localStorage.getItem('sak.mockDb') ?? '{}') as { cases: unknown[] };
    db.cases.push(supervisionCase);
    localStorage.setItem('sak.mockDb', JSON.stringify(db));
  }, UNASSIGNED_CASE);

  // Ingrid (Department of Supervision) borrows Maja Dahl from the Department of Business Management.
  await actAs(page, 'Ingrid Halvorsen – Leader');
  await gotoApp(page, `/cases/${UNASSIGNED_CASE.id}`);
  await page
    .getByLabel('Case worker')
    .selectOption({ label: 'Maja Dahl (Department of Business Management)' });
  await expectNoAccessibilityViolations(page);
  await page.getByRole('button', { name: 'Assign' }).click();
  await expect(page.getByText('The case is assigned to Maja Dahl.')).toBeVisible();
  await expect(
    page.getByText('Maja Dahl, borrowed from the Department of Business Management', {
      exact: true,
    }),
  ).toBeVisible();

  // Maja sees the case in her overview and works on it like on her own cases.
  await actAs(page, 'Maja Dahl – Case worker');
  await gotoApp(page, '/');
  await page.getByRole('link', { name: '2026/0100' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Case 2026/0100' })).toBeVisible();

  // Erik, Maja's leader, sees her under "Lent out" (he cannot open the case itself).
  await gotoApp(page, '/');
  await actAs(page, 'Erik Nygård – Leader');
  const lentOut = page.getByRole('region', { name: 'Lent out' });
  await expect(lentOut).toContainText('2026/0100, Department of Supervision: Maja Dahl');
  await expectNoAccessibilityViolations(page);
});
