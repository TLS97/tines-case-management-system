import { screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { readDb, writeDb } from '@/mocks/db';
import { makeCase } from '@/test/factories';
import { storeCases } from '@/test/mockCases';
import {
  actAs,
  INGRID_LEADER_DEPT_1,
  KARI_LEADER_DEPT_2,
  seedUser,
  TINE_CASE_WORKER_DEPT_1,
} from '@/test/mockUsers';
import { renderRoute } from '@/test/renderRoute';

// F-004: the leader's notice about cases with a deactivated case worker, on the Cases page.

const magnus = seedUser('magnus.berg@example.com');
const magnusCase = makeCase({
  caseNumber: '2026/0010',
  departmentId: 1,
  status: 'InProgress',
  assignedTo: magnus.id,
});

function deactivateMagnus() {
  const db = readDb();
  writeDb({
    ...db,
    users: db.users.map((u) => (u.id === magnus.id ? { ...u, isActive: false } : u)),
  });
}

const noticeHeading = { level: 2, name: '1 case has a deactivated case worker' } as const;

describe('F-004 deactivated case worker notice', () => {
  it('lists the case at the top of the leader’s Cases page, linking to it', async () => {
    storeCases(magnusCase);
    deactivateMagnus();
    actAs(INGRID_LEADER_DEPT_1);
    const { user } = renderRoute('/');

    const heading = await screen.findByRole('heading', noticeHeading);
    const notice = within(heading.parentElement as HTMLElement);
    expect(notice.getByRole('listitem')).toHaveTextContent('2026/0010 – Magnus Berg (deactivated)');

    await user.click(notice.getByRole('link', { name: '2026/0010' }));
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Case 2026/0010' }),
    ).toBeInTheDocument();
  });

  it('is gone after the leader reassigns the case', async () => {
    storeCases(magnusCase);
    deactivateMagnus();
    actAs(INGRID_LEADER_DEPT_1);
    const { user } = renderRoute(`/cases/${magnusCase.id}`);

    await user.selectOptions(await screen.findByLabelText('Case worker'), 'Tine Tester');
    await user.click(screen.getByRole('button', { name: 'Reassign' }));
    await screen.findByText('The case is assigned to Tine Tester.');
    await user.click(screen.getByRole('link', { name: 'Cases' }));

    await screen.findByRole('table');
    expect(screen.queryByRole('heading', noticeHeading)).not.toBeInTheDocument();
  });

  it.each([
    ['a leader of another department', KARI_LEADER_DEPT_2],
    ['a case worker', TINE_CASE_WORKER_DEPT_1],
  ])('is not shown to %s', async (_label, email) => {
    storeCases(magnusCase);
    deactivateMagnus();
    actAs(email);
    renderRoute('/');

    await screen.findByRole('heading', { level: 1, name: 'Cases' });
    await screen.findByText(/There are no cases to show yet|cases?$/);
    expect(screen.queryByRole('heading', noticeHeading)).not.toBeInTheDocument();
  });
});
