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

  it('shows Admin every case with its department and without the reactions column', async () => {
    storeCases(makeCase({ caseNumber: '2026/0004', departmentId: 2, field: 'ChildServices' }));
    const { table } = await openOverviewAs(LARS_ADMIN);

    expect(
      within(table)
        .getAllByRole('columnheader')
        .map((header) => header.textContent),
    ).toEqual(['Case number', 'Department', 'Field', 'Status', 'Case worker']);
    expect(rowTexts(table).slice(0, 2)).toEqual([
      ['2026/0004', 'Department of Child Welfare', 'Child services', 'Unassigned', 'Not assigned'],
      ['2026/0003', 'Department of Supervision', 'Health', 'Unassigned', 'Not assigned'],
    ]);
    expect(rowTexts(table)).toHaveLength(4);
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

describe('F-003 filters', () => {
  const closedHealthCase = makeCase({
    caseNumber: '2026/0004',
    departmentId: 1,
    status: 'Closed',
    assignedTo: tine.id,
    companies: [makeCompany({ reaction: 'NoReaction' })],
  });

  async function openWithFilters(email: string, path = '/') {
    storeCases(tinesCase, magnusCase, unassignedCase, closedHealthCase);
    actAs(email);
    const rendered = renderRoute(path);
    await screen.findByRole('table');
    return rendered;
  }

  const caseNumbers = () =>
    within(screen.getByRole('table'))
      .getAllByRole('link')
      .map((link) => link.textContent);

  it('filters by field, status and reaction, and combines them', async () => {
    const { user, router } = await openWithFilters(INGRID_LEADER_DEPT_1);

    await user.selectOptions(screen.getByLabelText('Field'), 'Health');
    expect(caseNumbers()).toEqual(['2026/0004', '2026/0003', '2026/0002']);

    await user.selectOptions(screen.getByLabelText('Status'), 'Closed');
    expect(caseNumbers()).toEqual(['2026/0004']);
    expect(screen.getByText('Showing 1 of 4 cases.')).toBeInTheDocument();
    expect(router.state.location.search).toBe('?field=Health&status=Closed');

    await user.selectOptions(screen.getByLabelText('Status'), 'All statuses');
    await user.selectOptions(screen.getByLabelText('Field'), 'All fields');
    await user.selectOptions(screen.getByLabelText('Reaction'), 'Self-assessment');
    expect(caseNumbers()).toEqual(['2026/0001']);
  });

  it('matches a reaction given to any party in the case', async () => {
    const { user } = await openWithFilters(INGRID_LEADER_DEPT_1);

    // 2026/0001: health personnel Restriction of practice, company Self-assessment.
    await user.selectOptions(screen.getByLabelText('Reaction'), 'Restriction of practice');

    expect(caseNumbers()).toEqual(['2026/0001']);
  });

  it('says when no case matches, and clears all filters', async () => {
    const { user, router } = await openWithFilters(INGRID_LEADER_DEPT_1);

    await user.selectOptions(screen.getByLabelText('Field'), 'Child services');

    expect(screen.getByText('No cases match the filters.')).toBeInTheDocument();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Clear filters' }));

    expect(caseNumbers()).toHaveLength(4);
    expect(router.state.location.search).toBe('');
    expect(screen.getByLabelText('Field')).toHaveValue('');
    expect(screen.queryByRole('button', { name: 'Clear filters' })).not.toBeInTheDocument();
  });

  it('reads the filters from the address, so they survive a reload', async () => {
    await openWithFilters(INGRID_LEADER_DEPT_1, '/?status=InProgress&field=Social');

    expect(caseNumbers()).toEqual(['2026/0001']);
    expect(screen.getByLabelText('Status')).toHaveValue('InProgress');
    expect(screen.getByLabelText('Field')).toHaveValue('Social');
  });

  it('gives Admin no reaction filter, and ignores one in the address', async () => {
    await openWithFilters(LARS_ADMIN, '/?reaction=Prohibition');

    expect(screen.queryByLabelText('Reaction')).not.toBeInTheDocument();
    expect(caseNumbers()).toHaveLength(4);
  });
});

describe('F-004 "Lent out" list', () => {
  const borrowed = makeCase({
    caseNumber: '2026/0030',
    departmentId: 3,
    status: 'InProgress',
    assignedTo: magnus.id,
  });

  it('shows the leader their case workers’ cases in other departments, without links', async () => {
    storeCases(borrowed);
    await openOverviewAs(INGRID_LEADER_DEPT_1);

    const lentOut = await screen.findByRole('region', { name: 'Lent out' });
    expect(within(lentOut).getByRole('listitem')).toHaveTextContent(
      '2026/0030, Department of Business Management: Magnus Berg',
    );
    expect(within(lentOut).queryByRole('link')).not.toBeInTheDocument();
  });

  it('is not shown when none of their case workers are lent out', async () => {
    await openOverviewAs(INGRID_LEADER_DEPT_1);

    expect(screen.queryByRole('region', { name: 'Lent out' })).not.toBeInTheDocument();
  });

  it.each([
    ['the leader of the borrowing department', 'erik.nygard@example.com'],
    ['the borrowed case worker', 'magnus.berg@example.com'],
    ['Admin', LARS_ADMIN],
  ])('is not shown to %s', async (_label, email) => {
    storeCases(borrowed);
    await openOverviewAs(email);

    expect(screen.queryByRole('region', { name: 'Lent out' })).not.toBeInTheDocument();
  });
});
