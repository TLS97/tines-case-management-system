import { Paragraph } from '@digdir/designsystemet-react';
import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { AppLayout } from '@/app/layout/AppLayout';
import { readDb, writeDb } from '@/mocks/db';
import { SEED_USERS } from '@/mocks/seed/users';
import { renderRoute } from '@/test/renderRoute';
import { useCurrentUser } from './useCurrentUser';

function CurrentUserName() {
  const user = useCurrentUser();
  return (
    <Paragraph>
      {user.firstName} {user.surname}
    </Paragraph>
  );
}

const routes = [{ Component: AppLayout, children: [{ path: '/', Component: CurrentUserName }] }];

describe('useCurrentUser', () => {
  it('returns Tine Tester by default, after showing the loading state', async () => {
    renderRoute('/', routes);

    expect(screen.getByLabelText('Loading')).toBeInTheDocument();
    expect(await screen.findByText('Tine Tester')).toBeInTheDocument();
  });

  it('returns the user chosen in the mock API', async () => {
    const leader = SEED_USERS.find((user) => user.email === 'erik.nygard@example.com');
    writeDb({ ...readDb(), currentUserId: leader?.id ?? '' });

    renderRoute('/', routes);

    expect(await screen.findByText('Erik Nygård')).toBeInTheDocument();
  });
});
