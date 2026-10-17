import { expect, expectNoAccessibilityViolations, gotoApp, test } from './fixtures';

const CASE_ID = '7a2c9e10-0000-4000-8000-0000000000c1';
const MAGNUS_ID = '1f166c34-2e8c-4b53-97ca-b1dd4f9e787c';

// An Assigned case in department 1 for Magnus Berg, with one health personnel.
const SEEDED_CASE = {
  id: CASE_ID,
  caseNumber: '2026/0050',
  status: 'Assigned',
  field: 'Health',
  departmentId: 1,
  assignedTo: MAGNUS_ID,
  readAccess: [],
  healthPersonnel: [
    {
      id: '7a2c9e10-0000-4000-8000-0000000000c2',
      healthPersonnelNumber: '9000111',
      firstName: 'Existingfirst',
      surname: 'Existinglast',
      authorizations: [{ validFromDate: '2020-01-01', validToDate: null, description: 'Nurse' }],
    },
  ],
  companies: [],
};

test('F-002 the assigned case worker edits the case', async ({ page }) => {
  await gotoApp(page, '/');
  await page.evaluate((supervisionCase) => {
    const db = JSON.parse(localStorage.getItem('sak.mockDb') ?? '{}') as { cases: unknown[] };
    db.cases.push(supervisionCase);
    localStorage.setItem('sak.mockDb', JSON.stringify(db));
  }, SEEDED_CASE);
  const switcher = page.getByLabel('Acting as');
  await switcher.selectOption({ label: 'Magnus Berg – Case worker' });
  await expect(switcher).toBeEnabled();
  await gotoApp(page, `/cases/${CASE_ID}`);
  const summary = (label: string) => page.locator('dt', { hasText: label }).locator('+ dd');

  // Change field: the first change moves the case to In progress.
  await page.getByLabel('Field', { exact: true }).selectOption({ label: 'Social' });
  await page.getByRole('button', { name: 'Change field' }).click();
  await expect(page.getByText('The field is changed to Social.')).toBeVisible();
  await expect(summary('Status')).toHaveText('In progress');

  // Add health personnel with real date inputs.
  await page.getByRole('button', { name: 'Add health personnel' }).click();
  await page.getByLabel('Health personnel number').fill('9000222');
  await page.getByLabel('First name').fill('Newfirst');
  await page.getByLabel('Surname').fill('Newlast');
  await page.getByLabel('Description').fill('Physician');
  await page.getByLabel('Valid from').fill('2021-05-01');
  await expectNoAccessibilityViolations(page);
  await page.getByRole('button', { name: 'Add health personnel' }).click();
  await expect(page.getByText('Newfirst Newlast was added.')).toBeVisible();
  await expect(page.getByRole('heading', { level: 3, name: 'Newfirst Newlast' })).toBeVisible();

  // Remove the existing person, after confirming.
  await page.getByRole('button', { name: 'Remove Existingfirst Existinglast' }).click();
  const dialog = page.getByRole('dialog', {
    name: 'Remove Existingfirst Existinglast from the case?',
  });
  await expect(dialog).toBeVisible();
  await expectNoAccessibilityViolations(page);
  await dialog.getByRole('button', { name: 'Remove' }).click();
  await expect(page.getByText('Existingfirst Existinglast was removed.')).toBeVisible();
  await expect(
    page.getByRole('heading', { level: 3, name: 'Existingfirst Existinglast' }),
  ).toHaveCount(0);

  // Add a company.
  await page.getByRole('button', { name: 'Add company' }).click();
  await page.getByLabel('Organization number').fill('900000222');
  await page.getByLabel('Name', { exact: true }).fill('New Clinic');
  await page.getByLabel('Street name').fill('New Street 5');
  await page.getByLabel('Zip code').fill('0789');
  await page.getByLabel('State').fill('New State');
  await page.getByLabel('Country').fill('Norway');
  await expectNoAccessibilityViolations(page);
  await page.getByRole('button', { name: 'Add company' }).click();
  await expect(page.getByText('New Clinic was added.')).toBeVisible();

  // Give reactions: each selector offers only that party's reactions.
  await page.getByLabel('Reaction for Newfirst Newlast').selectOption({ label: 'Prohibition' });
  await page
    .getByRole('listitem')
    .filter({ has: page.getByLabel('Reaction for Newfirst Newlast') })
    .getByRole('button', { name: 'Save reaction' })
    .click();
  await page.getByLabel('Reaction for New Clinic').selectOption({ label: 'Self-assessment' });
  await page
    .getByRole('listitem')
    .filter({ has: page.getByLabel('Reaction for New Clinic') })
    .getByRole('button', { name: 'Save reaction' })
    .click();
  await expect(page.getByText('The reaction is saved.')).toHaveCount(2);
  await expectNoAccessibilityViolations(page);

  // The changes are saved: they are still there after a reload.
  await page.reload();
  await expect(page.getByRole('heading', { level: 3, name: 'Newfirst Newlast' })).toBeVisible();
  await expect(summary('Field')).toHaveText('Social');
  await expect(page.getByRole('heading', { level: 3, name: 'New Clinic' })).toBeVisible();
  await expect(page.getByLabel('Reaction for Newfirst Newlast')).toHaveValue('Prohibition');
  await expect(page.getByLabel('Reaction for New Clinic')).toHaveValue('SelfAssessment');
});
