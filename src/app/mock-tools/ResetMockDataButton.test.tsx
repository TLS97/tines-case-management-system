import { screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { readDb, writeDb } from '@/mocks/db';
import { SEED_USERS } from '@/mocks/seed/users';

// A valid change to the mock data: the first user gets a new surname.
function renameFirstUser() {
  const db = readDb();
  writeDb({ ...db, users: db.users.map((u, i) => (i === 0 ? { ...u, surname: 'Changed' } : u)) });
}
import { renderRoute } from '@/test/renderRoute';

describe('Reset mock data', () => {
  it('asks for confirmation, then restores the seed data and says so', async () => {
    renameFirstUser();
    const { user } = renderRoute('/');

    await user.click(await screen.findByRole('button', { name: 'Reset mock data' }));
    const dialog = screen.getByRole('dialog', { name: 'Reset mock data?' });
    await user.click(within(dialog).getByRole('button', { name: 'Reset' }));

    expect(await screen.findByText('Mock data has been reset.')).toBeInTheDocument();
    expect(readDb().users[0]?.surname).toBe(SEED_USERS[0]?.surname);
    expect(dialog).not.toBeVisible();
  });

  it('changes nothing when cancelled', async () => {
    renameFirstUser();
    const { user } = renderRoute('/');

    await user.click(await screen.findByRole('button', { name: 'Reset mock data' }));
    const dialog = screen.getByRole('dialog', { name: 'Reset mock data?' });
    await user.click(within(dialog).getByRole('button', { name: 'Cancel' }));

    expect(dialog).not.toBeVisible();
    expect(readDb().users[0]?.surname).toBe('Changed');
  });
});
