import type { Page } from '@playwright/test';
import {
  expect,
  expectNoAccessibilityViolations,
  failedRequestLine,
  gotoApp,
  test,
} from './fixtures';

const CASE_ID = '5d1e6c2a-0000-4000-8000-0000000000aa';
const TINE_ID = '94856e69-dc05-462d-80f6-8f1be92911cd';

// A case in department 1, assigned to Tine Tester, with one health personnel and one company.
const SEEDED_CASE = {
  id: CASE_ID,
  caseNumber: '2026/0042',
  status: 'InProgress',
  field: 'Health',
  departmentId: 1,
  assignedTo: TINE_ID,
  readAccess: [],
  healthPersonnel: [
    {
      id: '5d1e6c2a-0000-4000-8000-0000000000bb',
      healthPersonnelNumber: '9000123',
      firstName: 'Fakefirst',
      surname: 'Fakelast',
      authorizations: [
        { validFromDate: '2020-01-01', validToDate: null, description: 'Registered nurse' },
      ],
      reaction: 'Prohibition',
    },
  ],
  companies: [
    {
      organizationNumber: '900000123',
      name: 'Fake Care Home',
      description: '',
      address: {
        streetName: 'Fake Road 1',
        zipCode: '0123',
        state: 'Fake State',
        country: 'Norway',
      },
    },
  ],
};

async function seedCaseAndActAs(page: Page, userLabel: string) {
  await gotoApp(page, '/');
  await page.evaluate((supervisionCase) => {
    const db = JSON.parse(localStorage.getItem('sak.mockDb') ?? '{}') as { cases: unknown[] };
    db.cases.push(supervisionCase);
    localStorage.setItem('sak.mockDb', JSON.stringify(db));
  }, SEEDED_CASE);
  const switcher = page.getByLabel('Acting as');
  await switcher.selectOption({ label: userLabel });
  await expect(switcher).toBeEnabled();
  await gotoApp(page, `/cases/${CASE_ID}`);
}

test('F-002 a leader sees the whole case', async ({ page }) => {
  await seedCaseAndActAs(page, 'Ingrid Halvorsen – Leader');

  await expect(page.getByRole('heading', { level: 1, name: 'Case 2026/0042' })).toBeVisible();
  await expect(page.getByRole('main').getByText('Tine Tester')).toBeVisible();
  await expect(page.getByRole('heading', { level: 3, name: 'Fakefirst Fakelast' })).toBeVisible();
  await expect(page.getByRole('heading', { level: 3, name: 'Fake Care Home' })).toBeVisible();
  await expectNoAccessibilityViolations(page);
});

test('F-004 Admin sees the restricted view only', async ({ page }) => {
  await seedCaseAndActAs(page, 'Lars Johansen – Admin');

  await expect(page.getByRole('heading', { level: 1, name: 'Case 2026/0042' })).toBeVisible();
  await expect(page.getByText(/without its sensitive data/)).toBeVisible();
  await expect(page.getByRole('main')).not.toContainText('Fakefirst');
  await expect(page.getByRole('main')).not.toContainText('Fake Care Home');
  await expectNoAccessibilityViolations(page);
});

test.describe('without access', () => {
  // The mock API answers 403, which the browser logs as a failed request.
  test.use({ expectedConsoleErrors: [failedRequestLine(403)] });

  test('F-004 a leader of another department has no access', async ({ page }) => {
    await seedCaseAndActAs(page, 'Kari Solberg – Leader');

    await expect(
      page.getByRole('heading', { level: 1, name: 'No access to this case' }),
    ).toBeVisible();
    await expect(page.getByRole('main')).not.toContainText('Fakefirst');
  });
});
