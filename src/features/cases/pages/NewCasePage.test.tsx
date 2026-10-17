import { screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { readDb } from '@/mocks/db';
import { renderRoute } from '@/test/renderRoute';
import {
  actAs,
  INGRID_LEADER_DEPT_1,
  KARI_LEADER_DEPT_2,
  LARS_ADMIN,
  TINE_CASE_WORKER_DEPT_1,
} from '@/test/mockUsers';

describe('F-001 New case button on the overview', () => {
  it('is shown to a leader and opens the new case page', async () => {
    actAs(INGRID_LEADER_DEPT_1);
    const { user } = renderRoute('/');

    await user.click(await screen.findByRole('link', { name: 'New case' }));

    expect(await screen.findByRole('heading', { level: 1, name: 'New case' })).toBeInTheDocument();
  });

  it.each([
    ['a case worker', TINE_CASE_WORKER_DEPT_1],
    ['an admin', LARS_ADMIN],
  ])('is not shown to %s', async (_label, email) => {
    actAs(email);
    renderRoute('/');

    await screen.findByRole('heading', { level: 1, name: 'Cases' });
    expect(screen.queryByRole('link', { name: 'New case' })).not.toBeInTheDocument();
  });
});

describe('F-001 New case page', () => {
  it('presets the field to the leader’s primary field and lists only their fields', async () => {
    actAs(KARI_LEADER_DEPT_2); // primary ChildServices; fields ChildServices, Social
    renderRoute('/cases/new');

    const select = await screen.findByLabelText<HTMLSelectElement>('Field');

    expect(select).toHaveValue('ChildServices');
    expect(
      within(select)
        .getAllByRole('option')
        .map((option) => option.textContent),
    ).toEqual(['Child services', 'Social']);
    expect(screen.getByText(/Department of Child Welfare/)).toBeInTheDocument();
  });

  it('creates the case in the chosen field and opens the case detail page', async () => {
    const leader = actAs(INGRID_LEADER_DEPT_1);
    const { user, router } = renderRoute('/cases/new');

    await user.selectOptions(await screen.findByLabelText('Field'), 'Social');
    await user.click(screen.getByRole('button', { name: 'Create case' }));

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Case details' }),
    ).toBeInTheDocument();
    const [created] = readDb().cases;
    expect(created).toMatchObject({
      field: 'Social',
      status: 'Unassigned',
      departmentId: leader.departmentId,
    });
    expect(router.state.location.pathname).toBe(`/cases/${created?.id}`);
  });

  it.each([
    ['a case worker', TINE_CASE_WORKER_DEPT_1],
    ['an admin', LARS_ADMIN],
  ])('shows %s that only leaders can create cases, without a form', async (_label, email) => {
    actAs(email);
    renderRoute('/cases/new');

    expect(await screen.findByText('Only leaders can create cases.')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Create case' })).not.toBeInTheDocument();
  });

  it('shows an error and stays on the page when the mock API refuses', async () => {
    actAs(INGRID_LEADER_DEPT_1);
    const { user } = renderRoute('/cases/new');
    await screen.findByLabelText('Field');
    // The user is switched to a case worker after the page was opened.
    actAs(TINE_CASE_WORKER_DEPT_1);

    await user.click(screen.getByRole('button', { name: 'Create case' }));

    expect(
      await screen.findByText('You are not allowed to create a case in this field.'),
    ).toBeInTheDocument();
    await waitFor(() => expect(readDb().auditLog[0]?.result).toBe('Denied'));
    expect(readDb().cases).toEqual([]);
  });
});
