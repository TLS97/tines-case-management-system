import { screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { readDb } from '@/mocks/db';
import { actAs, INGRID_LEADER_DEPT_1, LARS_ADMIN, TINE_CASE_WORKER_DEPT_1 } from '@/test/mockUsers';
import { renderRoute } from '@/test/renderRoute';

// F-004 user admin: the Users page.

async function openAsAdmin() {
  actAs(LARS_ADMIN);
  const rendered = renderRoute('/admin/users');
  const table = await screen.findByRole('table');
  return { ...rendered, table };
}

async function fillUser(user: Awaited<ReturnType<typeof openAsAdmin>>['user'], email: string) {
  await user.click(screen.getByRole('button', { name: 'Add user' }));
  await user.type(screen.getByLabelText('First name'), 'Nina');
  await user.type(screen.getByLabelText('Surname'), 'Newcomer');
  await user.type(screen.getByLabelText('Email'), email);
  await user.selectOptions(screen.getByLabelText('Department'), 'Department of Child Welfare');
  await user.selectOptions(screen.getByLabelText('Primary field'), 'Social');
  await user.click(screen.getByLabelText('Child services'));
  await user.click(screen.getByRole('button', { name: 'Add user' }));
}

describe('F-004 Users page', () => {
  it('shows Admin every user with role, department, fields and status', async () => {
    const { table } = await openAsAdmin();

    expect(within(table).getByText('19 users')).toBeInTheDocument();
    const tine = within(table).getByRole('row', { name: /Tine Tester/ });
    const cells = within(tine).getAllByRole('cell');
    expect(cells.slice(0, 6).map((cell) => cell.textContent)).toEqual([
      'Tine Tester',
      'tine.tester@example.com',
      'Case worker',
      'Department of Supervision',
      'Health (primary)',
      'Active',
    ]);
    expect(
      within(cells[6] as HTMLElement).getByRole('button', { name: 'Deactivate Tine Tester' }),
    ).toBeInTheDocument();
  });

  it('adds a user, who then appears in the table and the user switcher', async () => {
    const { user, table } = await openAsAdmin();

    await fillUser(user, 'nina.newcomer@example.com');

    expect(await screen.findByText('Nina Newcomer was added.')).toBeInTheDocument();
    expect(await within(table).findByText('20 users')).toBeInTheDocument();
    const row = within(table).getByRole('row', { name: /Nina Newcomer/ });
    expect(row).toHaveTextContent('Department of Child Welfare');
    expect(row).toHaveTextContent('Social (primary), Child services');
    expect(
      await within(screen.getByLabelText('Acting as')).findByRole('option', {
        name: 'Nina Newcomer – Case worker',
      }),
    ).toBeInTheDocument();
    expect(readDb().users.at(-1)).toMatchObject({
      email: 'nina.newcomer@example.com',
      departmentId: 2,
      fields: ['Social', 'ChildServices'],
      isActive: true,
    });
  });

  it('only offers other fields than the primary field as extra fields', async () => {
    const { user } = await openAsAdmin();

    await user.click(screen.getByRole('button', { name: 'Add user' }));
    await user.selectOptions(screen.getByLabelText('Primary field'), 'Social');

    const others = within(screen.getByRole('group', { name: 'Other fields (optional)' }));
    expect(others.getAllByRole('checkbox').map((box) => box.getAttribute('value'))).toEqual([
      'Health',
      'ChildServices',
    ]);
  });

  it('shows what is wrong and adds nothing', async () => {
    const { user } = await openAsAdmin();

    await user.click(screen.getByRole('button', { name: 'Add user' }));
    await user.type(screen.getByLabelText('Email'), 'nina@');
    await user.click(screen.getByRole('button', { name: 'Add user' }));

    expect(await screen.findByText('Enter the first name')).toBeInTheDocument();
    expect(screen.getByText('Enter the surname')).toBeInTheDocument();
    expect(
      screen.getByText('Enter a valid email address, like name@example.com'),
    ).toBeInTheDocument();
    expect(readDb().users).toHaveLength(19);
  });

  it('says so when the email is already used', async () => {
    const { user } = await openAsAdmin();

    await fillUser(user, 'tine.tester@example.com');

    expect(await screen.findByText('A user with this email already exists.')).toBeInTheDocument();
    expect(readDb().users).toHaveLength(19);
  });

  it.each([
    ['a leader', INGRID_LEADER_DEPT_1],
    ['a case worker', TINE_CASE_WORKER_DEPT_1],
  ])('tells %s that only admins can manage users', async (_label, email) => {
    actAs(email);
    renderRoute('/admin/users');

    expect(await screen.findByText('Only admins can manage users.')).toBeInTheDocument();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });
});

describe('F-004 deactivate a user', () => {
  it('asks first, then deactivates the user', async () => {
    const { user, table } = await openAsAdmin();
    const magnusRow = within(table).getByRole('row', { name: /Magnus Berg/ });

    await user.click(within(magnusRow).getByRole('button', { name: 'Deactivate Magnus Berg' }));
    const dialog = screen.getByRole('dialog', { name: 'Deactivate Magnus Berg?' });
    expect(dialog).toHaveTextContent('until a leader reassigns them');
    await user.click(within(dialog).getByRole('button', { name: 'Deactivate' }));

    expect(await screen.findByText('Magnus Berg was deactivated.')).toBeInTheDocument();
    expect(await within(magnusRow).findByText('Deactivated')).toBeInTheDocument();
    expect(within(magnusRow).queryByRole('button', { name: /Deactivate/ })).not.toBeInTheDocument();
    expect(readDb().users.find((u) => u.email === 'magnus.berg@example.com')?.isActive).toBe(false);
    expect(
      await within(screen.getByLabelText('Acting as')).findByRole('option', {
        name: 'Magnus Berg – Case worker (deactivated)',
      }),
    ).toBeInTheDocument();
  });

  it('keeps the user active when cancelled', async () => {
    const { user, table } = await openAsAdmin();

    await user.click(within(table).getByRole('button', { name: 'Deactivate Magnus Berg' }));
    await user.click(
      within(screen.getByRole('dialog', { name: 'Deactivate Magnus Berg?' })).getByRole('button', {
        name: 'Cancel',
      }),
    );

    expect(readDb().users.find((u) => u.email === 'magnus.berg@example.com')?.isActive).toBe(true);
  });

  it('offers Admin no way to deactivate themselves', async () => {
    const { table } = await openAsAdmin();

    const ownRow = within(table).getByRole('row', { name: /Lars Johansen/ });
    expect(within(ownRow).queryByRole('button')).not.toBeInTheDocument();
  });
});
