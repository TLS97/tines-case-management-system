import { screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { AuditEntry } from '@/features/audit-log';
import { readDb, writeDb } from '@/mocks/db';
import { makeCase } from '@/test/factories';
import { storeCases } from '@/test/mockCases';
import {
  actAs,
  INGRID_LEADER_DEPT_1,
  LARS_ADMIN,
  seedUser,
  TINE_CASE_WORKER_DEPT_1,
} from '@/test/mockUsers';
import { renderRoute } from '@/test/renderRoute';

// F-005 (T3.8): Admin's global audit log with filters.

const ingrid = seedUser(INGRID_LEADER_DEPT_1);
const tine = seedUser(TINE_CASE_WORKER_DEPT_1);
const caseA = makeCase({ caseNumber: '2026/0001', departmentId: 1 });
const caseB = makeCase({ caseNumber: '2026/0002', departmentId: 2 });

const entries: AuditEntry[] = [
  {
    id: crypto.randomUUID(),
    timestamp: new Date(2026, 9, 17, 9).toISOString(),
    userId: ingrid.id,
    action: 'CaseAssigned',
    caseId: caseA.id,
    result: 'Success',
    details: { previousCaseWorkerId: null, newCaseWorkerId: tine.id },
  },
  {
    id: crypto.randomUUID(),
    timestamp: new Date(2026, 9, 18, 9).toISOString(),
    userId: tine.id,
    action: 'CaseOpened',
    caseId: caseB.id,
    result: 'Denied',
    details: {},
  },
];

async function openAsAdmin(path = '/admin/audit') {
  storeCases(caseA, caseB);
  writeDb({ ...readDb(), auditLog: entries });
  actAs(LARS_ADMIN);
  const rendered = renderRoute(path);
  const table = await screen.findByRole('table', { name: /entr/ });
  return { ...rendered, table };
}

const firstCells = (table: HTMLElement) =>
  within(table)
    .getAllByRole('row')
    .slice(1)
    .map((row) =>
      within(row)
        .getAllByRole('cell')
        .slice(1)
        .map((cell) => cell.textContent),
    );

describe('F-005 global audit log', () => {
  it('shows Admin every entry, newest first, with the case number', async () => {
    const { table } = await openAsAdmin();

    expect(
      within(table)
        .getAllByRole('columnheader')
        .map((header) => header.textContent),
    ).toEqual(['Time', 'User', 'Action', 'Case', 'Result', 'Details']);
    expect(firstCells(table)).toEqual([
      ['Tine Tester', 'Case opened', '2026/0002', 'Denied', '–'],
      ['Ingrid Halvorsen', 'Case assigned', '2026/0001', 'Success', 'To Tine Tester'],
    ]);
  });

  it('filters by action, user and result, and clears the filters', async () => {
    const { user, table } = await openAsAdmin();

    await user.selectOptions(screen.getByLabelText('Result'), 'Denied');
    expect(await screen.findByText('1 entry matches the filters.')).toBeInTheDocument();
    expect(firstCells(table).map((cells) => cells[1])).toEqual(['Case opened']);

    await user.selectOptions(screen.getByLabelText('User'), 'Ingrid Halvorsen');
    expect(await screen.findByText('No entries match the filters.')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Clear filters' }));
    expect(await screen.findByText('2 entries')).toBeInTheDocument();
    expect(screen.getByLabelText('Result')).toHaveValue('');
  });

  it('filters by case number when Enter is pressed', async () => {
    const { user } = await openAsAdmin();

    await user.type(screen.getByLabelText('Case'), '2026/0001{Enter}');

    expect(await screen.findByText('1 entry matches the filters.')).toBeInTheDocument();
    expect(screen.getByRole('cell', { name: '2026/0001' })).toBeInTheDocument();
    expect(screen.queryByRole('cell', { name: '2026/0002' })).not.toBeInTheDocument();
  });

  it('says what is wrong with a case that is neither a number nor an id', async () => {
    const { user } = await openAsAdmin();

    await user.type(screen.getByLabelText('Case'), '26-1{Enter}');

    expect(
      await screen.findByText('Enter a case number like 2026/0001, or a case id'),
    ).toBeInTheDocument();
    expect(screen.getByLabelText('Case')).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByText('2 entries')).toBeInTheDocument();
  });

  it('reads the filters from the address, so they survive a reload', async () => {
    await openAsAdmin('/admin/audit?from=2026-10-18&case=2026%2F0002');

    expect(await screen.findByText('1 entry matches the filters.')).toBeInTheDocument();
    expect(screen.getByLabelText('From')).toHaveValue('2026-10-18');
    expect(screen.getByLabelText('Case')).toHaveValue('2026/0002');
  });

  it('says when the log is empty', async () => {
    actAs(LARS_ADMIN);
    renderRoute('/admin/audit');

    expect(await screen.findByText('The audit log is empty.')).toBeInTheDocument();
  });

  it.each([
    ['a leader', INGRID_LEADER_DEPT_1],
    ['a case worker', TINE_CASE_WORKER_DEPT_1],
  ])('tells %s that only admins can see it', async (_label, email) => {
    actAs(email);
    renderRoute('/admin/audit');

    expect(await screen.findByText('Only admins can see the whole audit log.')).toBeInTheDocument();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });
});
