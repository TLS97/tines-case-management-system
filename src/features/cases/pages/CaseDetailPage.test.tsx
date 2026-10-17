import { screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { readDb } from '@/mocks/db';
import { makeCase, makeCompany, makeHealthPersonnel } from '@/test/factories';
import { storeCases } from '@/test/mockCases';
import {
  actAs,
  INGRID_LEADER_DEPT_1,
  KARI_LEADER_DEPT_2,
  LARS_ADMIN,
  seedUser,
  TINE_CASE_WORKER_DEPT_1,
} from '@/test/mockUsers';
import { renderRoute } from '@/test/renderRoute';

const tine = seedUser(TINE_CASE_WORKER_DEPT_1);

const person = makeHealthPersonnel({
  healthPersonnelNumber: '9000123',
  firstName: 'Fakefirst',
  surname: 'Fakelast',
  authorizations: [
    { validFromDate: '2020-01-01', validToDate: '2030-12-31', description: 'Registered nurse' },
  ],
  reaction: 'RestrictionOfPractice',
});
const company = makeCompany({
  organizationNumber: '900000123',
  name: 'Fake Care Home',
  address: { streetName: 'Fake Road 1', zipCode: '0123', state: 'Fake State', country: 'Norway' },
});
const supervisionCase = makeCase({
  caseNumber: '2026/0042',
  status: 'InProgress',
  field: 'Social',
  departmentId: 1,
  assignedTo: tine.id,
  healthPersonnel: [person],
  companies: [company],
});

describe('F-002 Case detail page', () => {
  it('shows the leader the case summary, health personnel and companies', async () => {
    storeCases(supervisionCase);
    actAs(INGRID_LEADER_DEPT_1);
    renderRoute(`/cases/${supervisionCase.id}`);

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Case 2026/0042' }),
    ).toBeInTheDocument();
    await waitFor(() => expect(document.title).toBe('Case 2026/0042 – Case management'));
    const summary = within(screen.getByRole('main'));
    expect(summary.getByText('In progress')).toBeInTheDocument();
    expect(summary.getByText('Department of Supervision')).toBeInTheDocument();
    expect(summary.getByText('Tine Tester')).toBeInTheDocument();

    const people = within(screen.getByRole('region', { name: 'Health personnel' }));
    expect(
      people.getByRole('heading', { level: 3, name: 'Fakefirst Fakelast' }),
    ).toBeInTheDocument();
    expect(people.getByText('Health personnel number: 9000123')).toBeInTheDocument();
    expect(people.getByRole('cell', { name: 'Registered nurse' })).toBeInTheDocument();
    expect(people.getByRole('cell', { name: '1 Jan 2020' })).toBeInTheDocument();
    expect(people.getByRole('cell', { name: '31 Dec 2030' })).toBeInTheDocument();
    expect(people.getByText('Reaction: Restriction of practice')).toBeInTheDocument();

    const companies = within(screen.getByRole('region', { name: 'Companies' }));
    expect(
      companies.getByRole('heading', { level: 3, name: 'Fake Care Home' }),
    ).toBeInTheDocument();
    expect(
      companies.getByText('Address: Fake Road 1, 0123, Fake State, Norway'),
    ).toBeInTheDocument();
    expect(companies.getByText('Reaction: No reaction given yet')).toBeInTheDocument();
  });

  it('shows a new case as Unassigned, without a case worker or parties', async () => {
    const newCase = makeCase({ departmentId: 1 });
    storeCases(newCase);
    actAs(INGRID_LEADER_DEPT_1);
    renderRoute(`/cases/${newCase.id}`);

    expect(await screen.findByText('Not assigned')).toBeInTheDocument();
    expect(screen.getByText('Unassigned')).toBeInTheDocument();
    expect(screen.getByText('No health personnel added yet.')).toBeInTheDocument();
    expect(screen.getByText('No companies added yet.')).toBeInTheDocument();
  });

  it('shows Admin the restricted view, with no trace of sensitive data', async () => {
    storeCases(supervisionCase);
    actAs(LARS_ADMIN);
    renderRoute(`/cases/${supervisionCase.id}`);

    expect(await screen.findByText(/without its sensitive data/)).toBeInTheDocument();
    expect(screen.getByText('Tine Tester')).toBeInTheDocument();
    expect(screen.queryByRole('region', { name: 'Health personnel' })).not.toBeInTheDocument();
    const main = screen.getByRole('main').textContent ?? '';
    for (const sensitive of [
      'Fakefirst',
      '9000123',
      'Registered nurse',
      'Fake Care Home',
      '900000123',
      'Fake Road',
    ]) {
      expect(main).not.toContain(sensitive);
    }
  });

  it('tells a user without access that they have no access', async () => {
    storeCases(supervisionCase);
    actAs(KARI_LEADER_DEPT_2);
    renderRoute(`/cases/${supervisionCase.id}`);

    expect(
      await screen.findByRole('heading', { level: 1, name: 'No access to this case' }),
    ).toBeInTheDocument();
    expect(screen.getByText('You do not have access to this case.')).toBeInTheDocument();
    expect(screen.queryByText('Fakefirst Fakelast')).not.toBeInTheDocument();
  });

  it('says when a case does not exist', async () => {
    renderRoute(`/cases/${crypto.randomUUID()}`);

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Case not found' }),
    ).toBeInTheDocument();
  });

  it('logs "case opened" once per visit: not on window focus, but again when reopened', async () => {
    storeCases(supervisionCase);
    actAs(INGRID_LEADER_DEPT_1);
    const { router } = renderRoute(`/cases/${supervisionCase.id}`);
    const heading = { level: 1, name: 'Case 2026/0042' } as const;
    const opened = () => readDb().auditLog.filter((entry) => entry.action === 'CaseOpened');
    await screen.findByRole('heading', heading);

    window.dispatchEvent(new Event('visibilitychange'));
    window.dispatchEvent(new Event('focus'));
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(opened()).toHaveLength(1);

    await router.navigate('/');
    await screen.findByRole('heading', { level: 1, name: 'Cases' });
    await router.navigate(`/cases/${supervisionCase.id}`);
    await screen.findByRole('heading', heading);
    await waitFor(() => expect(opened()).toHaveLength(2));
  });
});
