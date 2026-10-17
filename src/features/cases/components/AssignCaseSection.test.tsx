import { screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { readDb, writeDb } from '@/mocks/db';
import { makeCase } from '@/test/factories';
import { storeCases } from '@/test/mockCases';
import {
  actAs,
  INGRID_LEADER_DEPT_1,
  LARS_ADMIN,
  seedUser,
  TINE_CASE_WORKER_DEPT_1,
} from '@/test/mockUsers';
import { renderRoute } from '@/test/renderRoute';

const tine = seedUser(TINE_CASE_WORKER_DEPT_1);
const unassigned = makeCase({ caseNumber: '2026/0007', departmentId: 1, field: 'Health' });

/** The value next to a label in the case summary. */
function summaryValue(label: string) {
  return screen.getByText(label, { selector: 'dt' }).nextElementSibling;
}

async function openAsLeader(supervisionCase = unassigned) {
  storeCases(supervisionCase);
  actAs(INGRID_LEADER_DEPT_1);
  const rendered = renderRoute(`/cases/${supervisionCase.id}`);
  await screen.findByRole('heading', { level: 1, name: `Case ${supervisionCase.caseNumber}` });
  return rendered;
}

describe('F-004 Assign case (leader)', () => {
  it('lists the eligible case workers: own department first, then others to borrow', async () => {
    await openAsLeader();

    const select = await screen.findByLabelText<HTMLSelectElement>('Case worker');
    const optionsIn = (group: HTMLElement) =>
      within(group)
        .getAllByRole('option')
        .map((option) => option.textContent);

    expect(screen.getByRole('heading', { level: 2, name: 'Assign case' })).toBeInTheDocument();
    expect(
      within(select)
        .getAllByRole('group')
        .map((group) => group.getAttribute('label')),
    ).toEqual(['Your department', 'Other departments (borrow)']);
    const [own, others] = within(select).getAllByRole('group');
    expect(optionsIn(own as HTMLElement)).toEqual([
      'Tine Tester',
      'Magnus Berg',
      'Henrik Aasen',
      'Nora Strand',
    ]);
    expect(optionsIn(others as HTMLElement)).toEqual([
      'Maja Dahl (Department of Business Management)',
      'Oskar Ruud (Department of Business Management)',
      'Hanna Sæther (Department of Business Management)',
    ]);
  });

  it('borrows a case worker from another department, shown with their home department', async () => {
    const { user } = await openAsLeader();

    await user.selectOptions(
      await screen.findByLabelText('Case worker'),
      'Maja Dahl (Department of Business Management)',
    );
    await user.click(screen.getByRole('button', { name: 'Assign' }));

    expect(await screen.findByText('The case is assigned to Maja Dahl.')).toBeInTheDocument();
    expect(summaryValue('Case worker')).toHaveTextContent(
      'Maja Dahl, borrowed from the Department of Business Management',
    );
    expect(summaryValue('Department')).toHaveTextContent('Department of Supervision');
  });

  it('asks for a case worker before assigning', async () => {
    const { user } = await openAsLeader();
    await screen.findByLabelText('Case worker');

    await user.click(screen.getByRole('button', { name: 'Assign' }));

    expect(
      await screen.findByText('Choose a case worker', { selector: 'p, span, div' }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText('Case worker')).toHaveAttribute('aria-invalid', 'true');
    expect(readDb().cases[0]?.assignedTo).toBeNull();
  });

  it('assigns the case: summary shows the case worker and status Assigned', async () => {
    const { user } = await openAsLeader();

    await user.selectOptions(await screen.findByLabelText('Case worker'), 'Magnus Berg');
    await user.click(screen.getByRole('button', { name: 'Assign' }));

    expect(await screen.findByText('The case is assigned to Magnus Berg.')).toBeInTheDocument();
    expect(summaryValue('Case worker')).toHaveTextContent('Magnus Berg');
    expect(summaryValue('Status')).toHaveTextContent('Assigned');
    expect(screen.getByRole('heading', { level: 2, name: 'Reassign case' })).toBeInTheDocument();
    // The page was updated from the response: still only one "case opened" entry.
    expect(readDb().auditLog.filter((entry) => entry.action === 'CaseOpened')).toHaveLength(1);
  });

  it('reassigns: the current case worker is not offered', async () => {
    const assigned = makeCase({
      caseNumber: '2026/0008',
      departmentId: 1,
      field: 'Health',
      status: 'InProgress',
      assignedTo: tine.id,
    });
    const { user } = await openAsLeader(assigned);

    const select = await screen.findByLabelText('Case worker');
    expect(within(select).queryByRole('option', { name: 'Tine Tester' })).not.toBeInTheDocument();

    await user.selectOptions(select, 'Nora Strand');
    await user.click(screen.getByRole('button', { name: 'Reassign' }));

    expect(await screen.findByText('The case is assigned to Nora Strand.')).toBeInTheDocument();
    expect(readDb().cases[0]).toMatchObject({ status: 'InProgress' });
  });

  it('says so when nobody can take the case', async () => {
    // Nobody in any department has Child services any more.
    const db = readDb();
    writeDb({
      ...db,
      users: db.users.map((u) =>
        u.fields.includes('ChildServices') ? { ...u, isActive: false } : u,
      ),
    });
    await openAsLeader(
      makeCase({ caseNumber: '2026/0009', departmentId: 1, field: 'ChildServices' }),
    );

    expect(
      await screen.findByText(
        'There are no active case workers with access to the field Child services.',
      ),
    ).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Assign' })).not.toBeInTheDocument();
  });

  it.each([
    ['the case worker of the case', TINE_CASE_WORKER_DEPT_1],
    ['an admin', LARS_ADMIN],
  ])('is not shown to %s', async (_label, email) => {
    const assigned = makeCase({
      caseNumber: '2026/0010',
      departmentId: 1,
      status: 'Assigned',
      assignedTo: tine.id,
    });
    storeCases(assigned);
    actAs(email);
    renderRoute(`/cases/${assigned.id}`);

    await screen.findByRole('heading', { level: 1, name: 'Case 2026/0010' });
    expect(screen.queryByRole('heading', { name: /assign case/i })).not.toBeInTheDocument();
  });

  it('is not shown for a closed case', async () => {
    await openAsLeader(
      makeCase({ caseNumber: '2026/0011', departmentId: 1, status: 'Closed', assignedTo: tine.id }),
    );

    expect(screen.queryByRole('heading', { name: /assign case/i })).not.toBeInTheDocument();
  });
});
