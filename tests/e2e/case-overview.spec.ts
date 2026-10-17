import type { Page } from '@playwright/test';
import { expect, expectNoAccessibilityViolations, gotoApp, test } from './fixtures';

const MAGNUS_ID = '1f166c34-2e8c-4b53-97ca-b1dd4f9e787c';

// Two cases in department 1: one with a reaction, one unassigned.
const CASES = [
  {
    id: '6b3d1f20-0000-4000-8000-0000000000e1',
    caseNumber: '2026/0001',
    status: 'InProgress',
    field: 'Health',
    departmentId: 1,
    assignedTo: MAGNUS_ID,
    readAccess: [],
    healthPersonnel: [
      {
        id: '6b3d1f20-0000-4000-8000-0000000000e2',
        healthPersonnelNumber: '9000123',
        firstName: 'Fakefirst',
        surname: 'Fakelast',
        authorizations: [{ validFromDate: '2020-01-01', validToDate: null, description: 'Nurse' }],
        reaction: 'Prohibition',
      },
    ],
    companies: [],
  },
  {
    id: '6b3d1f20-0000-4000-8000-0000000000e3',
    caseNumber: '2026/0002',
    status: 'Unassigned',
    field: 'Social',
    departmentId: 1,
    assignedTo: null,
    readAccess: [],
    healthPersonnel: [],
    companies: [],
  },
];

async function seedAndActAs(page: Page, label: string) {
  await gotoApp(page, '/');
  await page.evaluate((cases) => {
    const db = JSON.parse(localStorage.getItem('sak.mockDb') ?? '{}') as { cases: unknown[] };
    db.cases.push(...cases);
    localStorage.setItem('sak.mockDb', JSON.stringify(db));
  }, CASES);
  const switcher = page.getByLabel('Acting as');
  await switcher.selectOption({ label });
  await expect(switcher).toBeEnabled();
}

test('F-003 a leader sees the department’s cases and opens one', async ({ page }) => {
  await seedAndActAs(page, 'Ingrid Halvorsen – Leader');
  const table = page.getByRole('table');

  await expect(table.getByText('2 cases')).toBeVisible();
  await expect(table.getByRole('row')).toHaveCount(3);
  await expect(table.getByRole('row', { name: /2026\/0001/ })).toContainText('Prohibition');
  await expectNoAccessibilityViolations(page);

  await table.getByRole('link', { name: '2026/0002' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Case 2026/0002' })).toBeVisible();
});

test('F-003 Admin sees every case without reactions', async ({ page }) => {
  await seedAndActAs(page, 'Lars Johansen – Admin');
  const table = page.getByRole('table');

  await expect(table.getByText('2 cases')).toBeVisible();
  await expect(table.getByRole('columnheader', { name: 'Reactions' })).toHaveCount(0);
  await expect(table).not.toContainText('Prohibition');
  await expectNoAccessibilityViolations(page);
});
