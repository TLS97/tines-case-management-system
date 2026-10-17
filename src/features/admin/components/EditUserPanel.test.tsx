import { screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { readDb } from '@/mocks/db';
import { makeCase } from '@/test/factories';
import { storeCases } from '@/test/mockCases';
import { actAs, LARS_ADMIN, seedUser } from '@/test/mockUsers';
import { renderRoute } from '@/test/renderRoute';

// F-004: Admin changes a user's fields and department on the Users page.

const magnus = seedUser('magnus.berg@example.com'); // dept 1, Health (primary) + Social

async function editMagnus() {
  actAs(LARS_ADMIN);
  const rendered = renderRoute('/admin/users');
  await screen.findByRole('table');
  await rendered.user.click(screen.getByRole('button', { name: 'Edit Magnus Berg' }));
  const panel = within(screen.getByRole('region', { name: 'Edit Magnus Berg' }));
  return { ...rendered, panel };
}

const magnusInDb = () => readDb().users.find((u) => u.id === magnus.id);

describe('F-004 edit a user', () => {
  it('opens a panel with focus on its heading', async () => {
    await editMagnus();

    expect(screen.getByRole('heading', { level: 2, name: 'Edit Magnus Berg' })).toHaveFocus();
  });

  it('changes the fields', async () => {
    const { user, panel } = await editMagnus();
    const save = panel.getByRole('button', { name: 'Save fields' });
    expect(save).toBeDisabled();

    await user.selectOptions(panel.getByLabelText('Primary field'), 'Social');
    await user.click(panel.getByLabelText('Child services'));
    await user.click(save);

    expect(await panel.findByText('The fields are saved.')).toBeInTheDocument();
    expect(magnusInDb()).toMatchObject({
      primaryField: 'Social',
      fields: ['Social', 'Health', 'ChildServices'],
    });
    expect(
      within(screen.getByRole('table')).getByRole('row', { name: /Magnus Berg/ }),
    ).toHaveTextContent('Social (primary), Health, Child services');
  });

  it('lists the open cases that block a move, instead of offering it', async () => {
    const openCase = makeCase({
      caseNumber: '2026/0010',
      departmentId: 1,
      status: 'InProgress',
      assignedTo: magnus.id,
    });
    storeCases(openCase);
    const { panel } = await editMagnus();

    expect(await panel.findByText(/A leader there must reassign them/)).toBeInTheDocument();
    expect(panel.getByRole('link', { name: '2026/0010' })).toHaveAttribute(
      'href',
      `/cases/${openCase.id}`,
    );
    expect(panel.queryByRole('button', { name: 'Move Magnus Berg' })).not.toBeInTheDocument();
  });

  it('moves the user when nothing blocks it', async () => {
    const { user, panel } = await editMagnus();

    await user.selectOptions(
      await panel.findByLabelText('Move to'),
      'Department of Business Management',
    );
    await user.click(panel.getByRole('button', { name: 'Move Magnus Berg' }));

    expect(
      await panel.findByText('Magnus Berg is moved to the Department of Business Management.'),
    ).toBeInTheDocument();
    await waitFor(() => expect(magnusInDb()?.departmentId).toBe(3));
    expect(
      panel.getByText('Magnus Berg is in the Department of Business Management.'),
    ).toBeInTheDocument();
  });

  it('closes with Done', async () => {
    const { user, panel } = await editMagnus();

    await user.click(panel.getByRole('button', { name: 'Done' }));

    expect(screen.queryByRole('region', { name: 'Edit Magnus Berg' })).not.toBeInTheDocument();
  });
});
