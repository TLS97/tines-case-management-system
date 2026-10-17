import { screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { readDb } from '@/mocks/db';
import { DEFAULT_USER_ID, SEED_USERS } from '@/mocks/seed/users';
import { renderRoute } from '@/test/renderRoute';

const KARI_SOLBERG = SEED_USERS.find((user) => user.email === 'kari.solberg@example.com');

async function findSwitcher() {
  const select = await screen.findByLabelText<HTMLSelectElement>('Acting as');
  await waitFor(() => expect(select).toBeEnabled());
  return select;
}

describe('User switcher', () => {
  it('starts as Tine Tester and lists all 19 users, grouped by department', async () => {
    renderRoute('/');

    const select = await findSwitcher();

    expect(select).toHaveValue(DEFAULT_USER_ID);
    expect(within(select).getAllByRole('option')).toHaveLength(19);
    expect(
      within(select)
        .getAllByRole('group')
        .map((group) => group.getAttribute('label')),
    ).toEqual([
      'Department of Supervision',
      'Department of Child Welfare',
      'Department of Business Management',
    ]);
    expect(
      within(select).getByRole('option', { name: 'Kari Solberg – Leader' }),
    ).toBeInTheDocument();
  });

  it('switches to the chosen user and saves the choice in the mock API', async () => {
    const { user } = renderRoute('/');
    const select = await findSwitcher();

    await user.selectOptions(select, 'Kari Solberg – Leader');

    await waitFor(() => expect(readDb().currentUserId).toBe(KARI_SOLBERG?.id));
    await waitFor(() => expect(select).toHaveValue(KARI_SOLBERG?.id));
  });

  it('goes back to Tine Tester after Reset mock data', async () => {
    const { user } = renderRoute('/');
    const select = await findSwitcher();
    await user.selectOptions(select, 'Kari Solberg – Leader');
    await waitFor(() => expect(select).toHaveValue(KARI_SOLBERG?.id));

    await user.click(screen.getByRole('button', { name: 'Reset mock data' }));
    await user.click(
      within(screen.getByRole('dialog', { name: 'Reset mock data?' })).getByRole('button', {
        name: 'Reset',
      }),
    );

    await waitFor(() => expect(select).toHaveValue(DEFAULT_USER_ID));
  });
});
