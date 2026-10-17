import { screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { readDb, writeDb } from '@/mocks/db';
import { renderRoute } from '@/test/renderRoute';

describe('Reset mock data', () => {
  it('asks for confirmation, then restores the seed data and says so', async () => {
    writeDb({ ...readDb(), users: [] });
    const { user } = renderRoute('/');

    await user.click(await screen.findByRole('button', { name: 'Reset mock data' }));
    const dialog = screen.getByRole('dialog', { name: 'Reset mock data?' });
    await user.click(within(dialog).getByRole('button', { name: 'Reset' }));

    expect(await screen.findByText('Mock data has been reset.')).toBeInTheDocument();
    expect(readDb().users).toHaveLength(19);
    expect(dialog).not.toBeVisible();
  });

  it('changes nothing when cancelled', async () => {
    writeDb({ ...readDb(), users: [] });
    const { user } = renderRoute('/');

    await user.click(await screen.findByRole('button', { name: 'Reset mock data' }));
    const dialog = screen.getByRole('dialog', { name: 'Reset mock data?' });
    await user.click(within(dialog).getByRole('button', { name: 'Cancel' }));

    expect(dialog).not.toBeVisible();
    expect(readDb().users).toHaveLength(0);
  });
});
