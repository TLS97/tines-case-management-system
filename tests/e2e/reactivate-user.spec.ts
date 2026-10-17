import type { Page } from '@playwright/test';
import { expect, expectNoAccessibilityViolations, gotoApp, test } from './fixtures';

const MAGNUS_ID = '1f166c34-2e8c-4b53-97ca-b1dd4f9e787c';
const SEEDED_CASE = {
  id: 'b7e1c2d0-0000-4000-8000-000000000301',
  caseNumber: '2026/0095',
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

test('F-004 reactivating a case worker: the leader is no longer told about their case', async ({
  page,
}) => {
  await gotoApp(page, '/');
  await page.evaluate(
    ({ supervisionCase, magnusId }) => {
      const db = JSON.parse(localStorage.getItem('sak.mockDb') ?? '{}') as {
        cases: unknown[];
        users: { id: string; isActive: boolean }[];
      };
      db.cases.push(supervisionCase);
      db.users = db.users.map((u) => (u.id === magnusId ? { ...u, isActive: false } : u));
      localStorage.setItem('sak.mockDb', JSON.stringify(db));
    },
    { supervisionCase: SEEDED_CASE, magnusId: MAGNUS_ID },
  );

  // Ingrid is told that Magnus Berg's case has a deactivated case worker.
  await actAs(page, 'Ingrid Halvorsen – Leader');
  await gotoApp(page, '/');
  const notice = page.getByRole('heading', {
    level: 2,
    name: '1 case has a deactivated case worker',
  });
  await expect(notice).toBeVisible();

  // Admin reactivates him.
  await actAs(page, 'Lars Johansen – Admin');
  await gotoApp(page, '/admin/users');
  const magnusRow = page.getByRole('table').getByRole('row', { name: /Magnus Berg/ });
  await expect(magnusRow).toContainText('Deactivated');
  await expectNoAccessibilityViolations(page);
  await magnusRow.getByRole('button', { name: 'Reactivate Magnus Berg' }).click();
  await expect(page.getByText('Magnus Berg was reactivated.')).toBeVisible();
  await expect(magnusRow.getByRole('button', { name: 'Deactivate Magnus Berg' })).toBeVisible();

  // The notice is gone, and Magnus can use the app again.
  await actAs(page, 'Ingrid Halvorsen – Leader');
  await gotoApp(page, '/');
  await expect(page.getByRole('table')).toContainText('Magnus Berg');
  await expect(notice).toHaveCount(0);
  await actAs(page, 'Magnus Berg – Case worker');
  await gotoApp(page, '/');
  await expect(page.getByRole('link', { name: '2026/0095' }).first()).toBeVisible();
});
