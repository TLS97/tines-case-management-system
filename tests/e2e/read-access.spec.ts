import type { Page } from '@playwright/test';
import {
  expect,
  expectNoAccessibilityViolations,
  failedRequestLine,
  gotoApp,
  test,
} from './fixtures';

const CASE_ID = '8c4e2a30-0000-4000-8000-0000000000f1';
const MAGNUS_ID = '1f166c34-2e8c-4b53-97ca-b1dd4f9e787c';

const SEEDED_CASE = {
  id: CASE_ID,
  caseNumber: '2026/0070',
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

// After the access is removed, Sofie opening the case gets a 403 from the mock API.
test.use({ expectedConsoleErrors: [failedRequestLine(403)] });

test('F-004 a leader gives and removes read access', async ({ page }) => {
  await gotoApp(page, '/');
  await page.evaluate((supervisionCase) => {
    const db = JSON.parse(localStorage.getItem('sak.mockDb') ?? '{}') as { cases: unknown[] };
    db.cases.push(supervisionCase);
    localStorage.setItem('sak.mockDb', JSON.stringify(db));
  }, SEEDED_CASE);

  // Ingrid gives Sofie Lunde read access.
  await actAs(page, 'Ingrid Halvorsen – Leader');
  await gotoApp(page, `/cases/${CASE_ID}`);
  const section = page.getByRole('region', { name: 'Read access' });
  await section.getByLabel('Give read access to').selectOption({ label: 'Sofie Lunde' });
  await section.getByRole('button', { name: 'Give read access' }).click();
  await expect(section.getByText('Sofie Lunde has read access.')).toBeVisible();
  await expectNoAccessibilityViolations(page);

  // Sofie sees the case in her overview and can open it, read-only.
  await actAs(page, 'Sofie Lunde – Case worker');
  await gotoApp(page, '/');
  await page.getByRole('table').getByRole('link', { name: '2026/0070' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Case 2026/0070' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Add health personnel' })).toHaveCount(0);

  // Ingrid removes it again; Sofie no longer has access.
  await actAs(page, 'Ingrid Halvorsen – Leader');
  await page
    .getByRole('region', { name: 'Read access' })
    .getByRole('button', { name: 'Remove read access for Sofie Lunde' })
    .click();
  await expect(page.getByText('Sofie Lunde no longer has read access.')).toBeVisible();
  await actAs(page, 'Sofie Lunde – Case worker');
  await expect(
    page.getByRole('heading', { level: 1, name: 'No access to this case' }),
  ).toBeVisible();
});
