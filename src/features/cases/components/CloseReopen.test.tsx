import { screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { readDb } from '@/mocks/db';
import { makeCase, makeCompany, makeHealthPersonnel } from '@/test/factories';
import { storeCases } from '@/test/mockCases';
import { actAs, INGRID_LEADER_DEPT_1, LARS_ADMIN, seedUser } from '@/test/mockUsers';
import { renderRoute } from '@/test/renderRoute';

// F-002 close case (assigned case worker) and F-004 reopen case (leader).

const MAGNUS = 'magnus.berg@example.com';
const magnus = seedUser(MAGNUS);

const personWithReaction = makeHealthPersonnel({
  healthPersonnelNumber: '9000001',
  firstName: 'Readyfirst',
  surname: 'Readylast',
  reaction: 'Prohibition',
});
const personWithout = makeHealthPersonnel({
  healthPersonnelNumber: '9000002',
  firstName: 'Waitingfirst',
  surname: 'Waitinglast',
});
const companyWithout = makeCompany({ name: 'Waiting Clinic' });

function caseFor(overrides = {}) {
  return makeCase({
    caseNumber: '2026/0030',
    departmentId: 1,
    status: 'InProgress',
    assignedTo: magnus.id,
    healthPersonnel: [personWithReaction],
    ...overrides,
  });
}

async function openAs(email: string, supervisionCase = caseFor()) {
  storeCases(supervisionCase);
  actAs(email);
  const rendered = renderRoute(`/cases/${supervisionCase.id}`);
  await screen.findByRole('heading', { level: 1, name: `Case ${supervisionCase.caseNumber}` });
  return rendered;
}

const summaryValue = (label: string) =>
  screen.getByText(label, { selector: 'dt' }).nextElementSibling;

describe('F-002 close case: what is missing', () => {
  it('asks for at least one health personnel or company', async () => {
    const { user } = await openAs(MAGNUS, caseFor({ healthPersonnel: [] }));

    expect(screen.getByText('Add at least one health personnel or company.')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Close case' }));

    expect(
      screen.getByText('The case cannot be closed yet. See what is missing above.'),
    ).toBeInTheDocument();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(readDb().cases[0]?.status).toBe('InProgress');
  });

  it('names every party that still needs a reaction', async () => {
    await openAs(
      MAGNUS,
      caseFor({
        healthPersonnel: [personWithReaction, personWithout],
        companies: [companyWithout],
      }),
    );

    expect(
      screen.getByText('Give a reaction to: Waitingfirst Waitinglast, Waiting Clinic.'),
    ).toBeInTheDocument();
  });
});

describe('F-002 close case', () => {
  it('closes a ready case after confirming; then nobody can change it', async () => {
    const { user } = await openAs(MAGNUS);

    await user.click(screen.getByRole('button', { name: 'Close case' }));
    const dialog = screen.getByRole('dialog', { name: 'Close case 2026/0030?' });
    await user.click(within(dialog).getByRole('button', { name: 'Close case' }));

    expect(await screen.findByText('The case is closed.')).toBeInTheDocument();
    expect(summaryValue('Status')).toHaveTextContent('Closed');
    expect(
      screen.getByText('This case is closed. Nobody can change it until a leader reopens it.'),
    ).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Close case' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Add health personnel' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Save reaction' })).not.toBeInTheDocument();
    expect(readDb().cases[0]?.status).toBe('Closed');
  });

  it('keeps the case open when cancelled', async () => {
    const { user } = await openAs(MAGNUS);

    await user.click(screen.getByRole('button', { name: 'Close case' }));
    await user.click(
      within(screen.getByRole('dialog', { name: 'Close case 2026/0030?' })).getByRole('button', {
        name: 'Cancel',
      }),
    );

    expect(readDb().cases[0]?.status).toBe('InProgress');
  });

  it.each([
    ['the leader', INGRID_LEADER_DEPT_1, () => caseFor()],
    [
      'the case worker, while the case is only Assigned',
      MAGNUS,
      () => caseFor({ status: 'Assigned' }),
    ],
  ])('is not offered to %s', async (_label, email, make) => {
    await openAs(email, make());

    expect(screen.queryByRole('heading', { name: 'Close case' })).not.toBeInTheDocument();
  });
});

describe('F-004 reopen case', () => {
  it('lets the leader reopen a closed case: it becomes In progress', async () => {
    const { user } = await openAs(INGRID_LEADER_DEPT_1, caseFor({ status: 'Closed' }));

    await user.click(screen.getByRole('button', { name: 'Reopen case' }));

    expect(
      await screen.findByText('The case is reopened. Its status is In progress.'),
    ).toBeInTheDocument();
    expect(summaryValue('Status')).toHaveTextContent('In progress');
    expect(screen.queryByRole('button', { name: 'Reopen case' })).not.toBeInTheDocument();
    expect(readDb().cases[0]?.status).toBe('InProgress');
  });

  it('is not offered to the case worker', async () => {
    await openAs(MAGNUS, caseFor({ status: 'Closed' }));

    expect(screen.queryByRole('button', { name: 'Reopen case' })).not.toBeInTheDocument();
  });

  it('Admin sees that the case is closed, and cannot reopen it', async () => {
    await openAs(LARS_ADMIN, caseFor({ status: 'Closed' }));

    expect(
      screen.getByText('This case is closed. Nobody can change it until a leader reopens it.'),
    ).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Reopen case' })).not.toBeInTheDocument();
  });
});

describe('announcements after closing', () => {
  it('are not shown to another user after switching (mock user switcher)', async () => {
    const { user } = await openAs(MAGNUS);
    await user.click(screen.getByRole('button', { name: 'Close case' }));
    await user.click(
      within(screen.getByRole('dialog', { name: 'Close case 2026/0030?' })).getByRole('button', {
        name: 'Close case',
      }),
    );
    expect(await screen.findByText('The case is closed.')).toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText('Acting as'), 'Ingrid Halvorsen – Leader');

    expect(await screen.findByRole('button', { name: 'Reopen case' })).toBeInTheDocument();
    expect(screen.queryByText('The case is closed.')).not.toBeInTheDocument();
  });
});
