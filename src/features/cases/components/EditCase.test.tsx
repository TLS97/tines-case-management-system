import { screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { readDb } from '@/mocks/db';
import { makeCase, makeHealthPersonnel } from '@/test/factories';
import { storeCases } from '@/test/mockCases';
import {
  actAs,
  INGRID_LEADER_DEPT_1,
  LARS_ADMIN,
  seedUser,
  TINE_CASE_WORKER_DEPT_1,
} from '@/test/mockUsers';
import { renderRoute } from '@/test/renderRoute';

// F-002: editing by the assigned case worker on the case detail page.

const MAGNUS = 'magnus.berg@example.com'; // CaseWorker, dept 1, Health + Social
const magnus = seedUser(MAGNUS);

const existingPerson = makeHealthPersonnel({
  healthPersonnelNumber: '9000111',
  firstName: 'Existingfirst',
  surname: 'Existinglast',
});

function caseFor(overrides = {}) {
  return makeCase({
    caseNumber: '2026/0020',
    departmentId: 1,
    field: 'Health',
    status: 'Assigned',
    assignedTo: magnus.id,
    healthPersonnel: [existingPerson],
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

function summaryValue(label: string) {
  return screen.getByText(label, { selector: 'dt' }).nextElementSibling;
}

describe('F-002 who can edit', () => {
  it('the assigned case worker sees the edit controls', async () => {
    await openAs(MAGNUS);

    expect(screen.getByRole('heading', { level: 2, name: 'Change field' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Add health personnel' })).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Remove Existingfirst Existinglast' }),
    ).toBeInTheDocument();
  });

  it.each([
    ['the leader', INGRID_LEADER_DEPT_1],
    ['an admin', LARS_ADMIN],
  ])('%s sees no edit controls', async (_label, email) => {
    await openAs(email);

    expect(screen.queryByRole('heading', { name: 'Change field' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Add health personnel' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^Remove / })).not.toBeInTheDocument();
  });

  it('nobody can edit a closed case', async () => {
    await openAs(MAGNUS, caseFor({ status: 'Closed' }));

    expect(screen.queryByRole('button', { name: 'Add health personnel' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^Remove / })).not.toBeInTheDocument();
  });

  it('a case worker with only the case’s field gets no "Change field"', async () => {
    const tine = seedUser(TINE_CASE_WORKER_DEPT_1); // Health only
    await openAs(TINE_CASE_WORKER_DEPT_1, caseFor({ assignedTo: tine.id }));

    expect(screen.getByRole('button', { name: 'Add health personnel' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Change field' })).not.toBeInTheDocument();
  });
});

describe('F-002 change field', () => {
  it('changes the field and moves the case to In progress', async () => {
    const { user } = await openAs(MAGNUS);

    await user.selectOptions(screen.getByLabelText('Field'), 'Social');
    await user.click(screen.getByRole('button', { name: 'Change field' }));

    expect(await screen.findByText('The field is changed to Social.')).toBeInTheDocument();
    expect(summaryValue('Field')).toHaveTextContent('Social');
    expect(summaryValue('Status')).toHaveTextContent('In progress');
    expect(readDb().cases[0]).toMatchObject({ field: 'Social', status: 'InProgress' });
  });
});

describe('F-002 add health personnel', () => {
  it('adds a person with two authorizations', async () => {
    const { user } = await openAs(MAGNUS);

    await user.click(screen.getByRole('button', { name: 'Add health personnel' }));
    await user.type(screen.getByLabelText('Health personnel number'), '9000222');
    await user.type(screen.getByLabelText('First name'), 'Newfirst');
    await user.type(screen.getByLabelText('Surname'), 'Newlast');
    const first = within(screen.getByRole('group', { name: 'Authorization 1' }));
    await user.type(first.getByLabelText('Description'), 'Nurse');
    await user.type(first.getByLabelText('Valid from'), '2019-02-01');
    await user.type(first.getByLabelText('Valid to (optional)'), '2024-12-31');
    await user.click(screen.getByRole('button', { name: 'Add another authorization' }));
    const second = within(screen.getByRole('group', { name: 'Authorization 2' }));
    await user.type(second.getByLabelText('Description'), 'Midwife');
    await user.type(second.getByLabelText('Valid from'), '2025-01-01');
    await user.click(screen.getByRole('button', { name: 'Add health personnel' }));

    expect(await screen.findByText('Newfirst Newlast was added.')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 3, name: 'Newfirst Newlast' })).toBeInTheDocument();
    expect(summaryValue('Status')).toHaveTextContent('In progress');
    expect(readDb().cases[0]?.healthPersonnel[1]).toMatchObject({
      healthPersonnelNumber: '9000222',
      authorizations: [
        { description: 'Nurse', validFromDate: '2019-02-01', validToDate: '2024-12-31' },
        { description: 'Midwife', validFromDate: '2025-01-01', validToDate: null },
      ],
    });
  });

  it('shows what is wrong and saves nothing', async () => {
    const { user } = await openAs(MAGNUS);

    await user.click(screen.getByRole('button', { name: 'Add health personnel' }));
    await user.type(screen.getByLabelText('Health personnel number'), '123-45');
    await user.click(screen.getByRole('button', { name: 'Add health personnel' }));

    expect(
      await screen.findByText('Enter 7 to 9 digits, with no spaces or other characters'),
    ).toBeInTheDocument();
    expect(screen.getByText('Enter the first name')).toBeInTheDocument();
    expect(screen.getByText('Enter the surname')).toBeInTheDocument();
    expect(screen.getByText('Enter the date the authorization is valid from')).toBeInTheDocument();
    expect(screen.getByLabelText('Health personnel number')).toHaveAttribute(
      'aria-invalid',
      'true',
    );
    expect(readDb().cases[0]?.healthPersonnel).toHaveLength(1);
  });

  it('says so when the person is already on the case', async () => {
    const { user } = await openAs(MAGNUS);

    await user.click(screen.getByRole('button', { name: 'Add health personnel' }));
    await user.type(screen.getByLabelText('Health personnel number'), '9000111');
    await user.type(screen.getByLabelText('First name'), 'Again');
    await user.type(screen.getByLabelText('Surname'), 'Again');
    await user.type(screen.getByLabelText('Valid from'), '2020-01-01');
    await user.click(screen.getByRole('button', { name: 'Add health personnel' }));

    expect(
      await screen.findByText('This health personnel is already on the case.'),
    ).toBeInTheDocument();
    expect(readDb().cases[0]?.healthPersonnel).toHaveLength(1);
  });
});

describe('F-002 remove health personnel', () => {
  it('asks first, then removes the person', async () => {
    const { user } = await openAs(MAGNUS, caseFor({ status: 'InProgress' }));

    await user.click(screen.getByRole('button', { name: 'Remove Existingfirst Existinglast' }));
    const dialog = screen.getByRole('dialog', {
      name: 'Remove Existingfirst Existinglast from the case?',
    });
    await user.click(within(dialog).getByRole('button', { name: 'Remove' }));

    expect(await screen.findByText('Existingfirst Existinglast was removed.')).toBeInTheDocument();
    expect(screen.getByText('No health personnel added yet.')).toBeInTheDocument();
    await waitFor(() => expect(readDb().cases[0]?.healthPersonnel).toEqual([]));
  });

  it('keeps the person when cancelled', async () => {
    const { user } = await openAs(MAGNUS);

    await user.click(screen.getByRole('button', { name: 'Remove Existingfirst Existinglast' }));
    const dialog = screen.getByRole('dialog', {
      name: 'Remove Existingfirst Existinglast from the case?',
    });
    await user.click(within(dialog).getByRole('button', { name: 'Cancel' }));

    expect(readDb().cases[0]?.healthPersonnel).toHaveLength(1);
    expect(readDb().cases[0]?.status).toBe('Assigned');
  });
});
