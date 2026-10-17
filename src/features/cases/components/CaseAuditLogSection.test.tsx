import { screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { readDb, writeDb } from '@/mocks/db';
import { makeCase, makeHealthPersonnel } from '@/test/factories';
import { storeCases } from '@/test/mockCases';
import {
  actAs,
  INGRID_LEADER_DEPT_1,
  LARS_ADMIN,
  seedUser,
  TINE_CASE_WORKER_DEPT_1,
} from '@/test/mockUsers';
import { renderRoute } from '@/test/renderRoute';

// F-005 (T3.7): a leader sees the audit log for a case in their department, on the case page.

const tine = seedUser(TINE_CASE_WORKER_DEPT_1);
const person = makeHealthPersonnel({ firstName: 'Fakefirst', surname: 'Fakelast' });
const supervisionCase = makeCase({
  caseNumber: '2026/0001',
  departmentId: 1,
  field: 'Health',
  healthPersonnel: [person],
});

function rowTexts(table: HTMLElement) {
  return within(table)
    .getAllByRole('row')
    .slice(1)
    .map((row) =>
      within(row)
        .getAllByRole('cell')
        .slice(1)
        .map((cell) => cell.textContent),
    );
}

async function openAs(email: string) {
  storeCases(supervisionCase);
  actAs(email);
  const rendered = renderRoute(`/cases/${supervisionCase.id}`);
  await screen.findByRole('heading', { level: 1, name: 'Case 2026/0001' });
  return rendered;
}

describe('F-005 audit log per case', () => {
  it('shows the leader the case’s entries, newest first, naming health personnel', async () => {
    const db = readDb();
    writeDb({
      ...db,
      auditLog: [
        {
          id: crypto.randomUUID(),
          timestamp: new Date(2026, 9, 17, 9).toISOString(),
          userId: tine.id,
          action: 'CaseUpdated',
          caseId: supervisionCase.id,
          result: 'Success',
          details: { change: 'HealthPersonnelAdded', healthPersonnelId: person.id },
        },
      ],
    });
    await openAs(INGRID_LEADER_DEPT_1);

    const table = await screen.findByRole('table', { name: /entr/ });
    expect(screen.getByRole('heading', { level: 2, name: 'Audit log' })).toBeInTheDocument();
    expect(within(table).getByText('2 entries')).toBeInTheDocument();
    expect(rowTexts(table)).toEqual([
      ['Ingrid Halvorsen', 'Case opened', 'Success', 'Full view'],
      ['Tine Tester', 'Case updated', 'Success', 'Health personnel added: Fakefirst Fakelast'],
    ]);
  });

  it('shows new entries after a change on the page', async () => {
    const { user } = await openAs(INGRID_LEADER_DEPT_1);
    await screen.findByText('1 entry');

    await user.selectOptions(await screen.findByLabelText('Case worker'), 'Tine Tester');
    await user.click(screen.getByRole('button', { name: 'Assign' }));

    expect(await screen.findByText('3 entries')).toBeInTheDocument();
    const table = screen.getByRole('table', { name: /entr/ });
    expect(rowTexts(table).slice(0, 2)).toEqual([
      ['Ingrid Halvorsen', 'Status changed', 'Success', 'Unassigned → Assigned'],
      ['Ingrid Halvorsen', 'Case assigned', 'Success', 'To Tine Tester'],
    ]);
    // Refreshing the log did not open the case again.
    expect(readDb().auditLog.filter((e) => e.action === 'CaseOpened')).toHaveLength(1);
  });

  it.each([
    ['the case worker of the case', TINE_CASE_WORKER_DEPT_1],
    ['Admin', LARS_ADMIN],
  ])('is not shown to %s', async (_label, email) => {
    storeCases({ ...supervisionCase, status: 'Assigned', assignedTo: tine.id });
    actAs(email);
    renderRoute(`/cases/${supervisionCase.id}`);
    await screen.findByRole('heading', { level: 1, name: 'Case 2026/0001' });

    expect(screen.queryByRole('heading', { name: 'Audit log' })).not.toBeInTheDocument();
  });
});
