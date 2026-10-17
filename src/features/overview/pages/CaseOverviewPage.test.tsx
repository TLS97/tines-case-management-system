import { screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { makeCase, makeCompany, makeHealthPersonnel } from '@/test/factories';
import { storeCases } from '@/test/mockCases';
import {
  actAs,
  INGRID_LEADER_DEPT_1,
  LARS_ADMIN,
  seedUser,
  TINE_CASE_WORKER_DEPT_1,
} from '@/test/mockUsers';
import { renderRoute } from '@/test/renderRoute';

// F-003: the case overview table, per role.

const tine = seedUser(TINE_CASE_WORKER_DEPT_1);
const magnus = seedUser('magnus.berg@example.com');

const tinesCase = makeCase({
  caseNumber: '2026/0001',
  departmentId: 1,
  field: 'Social',
  status: 'InProgress',
  assignedTo: tine.id,
  healthPersonnel: [makeHealthPersonnel({ reaction: 'RestrictionOfPractice' })],
  companies: [makeCompany({ reaction: 'SelfAssessment' })],
});
const magnusCase = makeCase({
  caseNumber: '2026/0002',
  departmentId: 1,
  status: 'Assigned',
  assignedTo: magnus.id,
});
const unassignedCase = makeCase({ caseNumber: '2026/0003', departmentId: 1 });

async function openOverviewAs(email: string) {
  storeCases(tinesCase, magnusCase, unassignedCase);
  actAs(email);
  const rendered = renderRoute('/');
  return { ...rendered, table: await screen.findByRole('table') };
}

function rowTexts(table: HTMLElement) {
  return within(table)
    .getAllByRole('row')
    .slice(1)
    .map((row) =>
      within(row)
        .getAllByRole('cell')
        .map((cell) => cell.textContent),
    );
}

describe('F-003 case overview', () => {
  it('shows the leader every case in the department with all columns, newest first', async () => {
    const { table } = await openOverviewAs(INGRID_LEADER_DEPT_1);

    expect(within(table).getByText('3 cases')).toBeInTheDocument();
    expect(
      within(table)
        .getAllByRole('columnheader')
        .map((header) => header.textContent),
    ).toEqual(['Case number', 'Field', 'Status', 'Case worker', 'Reactions']);
    expect(rowTexts(table)).toEqual([
      ['2026/0003', 'Health', 'Unassigned', 'Not assigned', '–'],
      ['2026/0002', 'Health', 'Assigned', 'Magnus Berg', '–'],
      [
        '2026/0001',
        'Social',
        'In progress',
        'Tine Tester',
        'Restriction of practice, Self-assessment',
      ],
    ]);
  });

  it('shows a case worker only their own cases', async () => {
    const { table } = await openOverviewAs(TINE_CASE_WORKER_DEPT_1);

    expect(rowTexts(table).map((cells) => cells[0])).toEqual(['2026/0001']);
    expect(within(table).getByText('1 case')).toBeInTheDocument();
  });

  it('shows Admin every case without the reactions column', async () => {
    const { table } = await openOverviewAs(LARS_ADMIN);

    expect(rowTexts(table)).toHaveLength(3);
    expect(
      within(table).queryByRole('columnheader', { name: 'Reactions' }),
    ).not.toBeInTheDocument();
    expect(table.textContent).not.toContain('Restriction of practice');
    expect(
      screen.getByText('You see these cases without sensitive data, so reactions are not shown.'),
    ).toBeInTheDocument();
  });

  it('opens a case from its case number', async () => {
    const { user, table } = await openOverviewAs(INGRID_LEADER_DEPT_1);

    await user.click(within(table).getByRole('link', { name: '2026/0001' }));

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Case 2026/0001' }),
    ).toBeInTheDocument();
  });

  it('says when there are no cases', async () => {
    actAs(INGRID_LEADER_DEPT_1);
    renderRoute('/');

    expect(await screen.findByText('There are no cases to show yet.')).toBeInTheDocument();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });

  it('shows a new case after it is created', async () => {
    actAs(INGRID_LEADER_DEPT_1);
    const { user } = renderRoute('/');
    await screen.findByText('There are no cases to show yet.');

    await user.click(screen.getByRole('link', { name: 'New case' }));
    await user.click(await screen.findByRole('button', { name: 'Create case' }));
    await screen.findByRole('heading', { level: 1, name: /^Case \d{4}\/0001$/ });
    await user.click(screen.getByRole('link', { name: 'Cases' }));

    const table = await screen.findByRole('table');
    expect(rowTexts(table)).toEqual([
      [
        expect.stringMatching(/^\d{4}\/0001$/) as unknown,
        'Health',
        'Unassigned',
        'Not assigned',
        '–',
      ],
    ]);
  });
});
