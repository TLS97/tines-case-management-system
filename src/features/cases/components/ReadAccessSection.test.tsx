import { screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { readDb } from '@/mocks/db';
import { makeCase } from '@/test/factories';
import { storeCases } from '@/test/mockCases';
import { actAs, INGRID_LEADER_DEPT_1, LARS_ADMIN, seedUser } from '@/test/mockUsers';
import { renderRoute } from '@/test/renderRoute';

// F-004: read access on the case page.

const MAGNUS = 'magnus.berg@example.com';
const magnus = seedUser(MAGNUS);
const sofie = seedUser('sofie.lunde@example.com');

function caseFor(overrides = {}) {
  return makeCase({
    caseNumber: '2026/0040',
    departmentId: 1,
    status: 'InProgress',
    assignedTo: magnus.id,
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

describe('F-004 read access on the case page', () => {
  it('lets the leader give read access to a case worker in the department', async () => {
    const { user } = await openAs(INGRID_LEADER_DEPT_1);
    const section = within(screen.getByRole('region', { name: 'Read access' }));
    const select = await section.findByLabelText('Give read access to');

    expect(section.getByText('No case workers have read access.')).toBeInTheDocument();
    expect(within(select).queryByRole('option', { name: 'Magnus Berg' })).not.toBeInTheDocument();

    await user.selectOptions(select, 'Sofie Lunde');
    await user.click(section.getByRole('button', { name: 'Give read access' }));

    expect(await section.findByText('Sofie Lunde has read access.')).toBeInTheDocument();
    expect(section.getByRole('listitem')).toHaveTextContent('Sofie Lunde');
    expect(within(select).queryByRole('option', { name: 'Sofie Lunde' })).not.toBeInTheDocument();
    expect(readDb().cases[0]?.readAccess).toEqual([sofie.id]);
  });

  it('lets the leader remove read access', async () => {
    const { user } = await openAs(INGRID_LEADER_DEPT_1, caseFor({ readAccess: [sofie.id] }));
    const section = within(screen.getByRole('region', { name: 'Read access' }));

    await user.click(
      await section.findByRole('button', { name: 'Remove read access for Sofie Lunde' }),
    );

    expect(await section.findByText('Sofie Lunde no longer has read access.')).toBeInTheDocument();
    expect(section.getByText('No case workers have read access.')).toBeInTheDocument();
    await waitFor(() => expect(readDb().cases[0]?.readAccess).toEqual([]));
  });

  it.each([
    ['the assigned case worker', MAGNUS, () => caseFor()],
    [
      'a case worker with read access',
      'sofie.lunde@example.com',
      () => caseFor({ readAccess: [sofie.id] }),
    ],
    ['an admin', LARS_ADMIN, () => caseFor()],
    ['the leader, on a closed case', INGRID_LEADER_DEPT_1, () => caseFor({ status: 'Closed' })],
  ])('is not shown to %s', async (_label, email, make) => {
    await openAs(email, make());

    expect(screen.queryByRole('region', { name: 'Read access' })).not.toBeInTheDocument();
  });

  it('a case worker with read access sees the case without edit controls', async () => {
    await openAs('sofie.lunde@example.com', caseFor({ readAccess: [sofie.id] }));

    expect(screen.queryByRole('button', { name: 'Add health personnel' })).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Close case' })).not.toBeInTheDocument();
  });
});
