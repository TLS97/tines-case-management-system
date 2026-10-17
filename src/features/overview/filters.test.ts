import { describe, expect, it } from 'vitest';
import { filterRows, hasFilters, parseFilters } from './filters';
import type { OverviewRow } from './types';

function row(overrides: Partial<Extract<OverviewRow, { access: 'full' }>>): OverviewRow {
  return {
    access: 'full',
    id: crypto.randomUUID(),
    caseNumber: '2026/0001',
    field: 'Health',
    status: 'InProgress',
    departmentId: 1,
    assignedCaseWorker: null,
    reactions: [],
    ...overrides,
  };
}

const healthOpen = row({
  caseNumber: '2026/0001',
  field: 'Health',
  status: 'InProgress',
  reactions: ['Prohibition', 'SelfAssessment'],
});
const healthClosed = row({
  caseNumber: '2026/0002',
  field: 'Health',
  status: 'Closed',
  reactions: ['NoReaction'],
});
const socialOpen = row({
  caseNumber: '2026/0003',
  field: 'Social',
  status: 'InProgress',
  reactions: ['Prohibition'],
});
const rows = [healthOpen, healthClosed, socialOpen];
const numbers = (result: OverviewRow[]) => result.map((r) => r.caseNumber);

describe('F-003 filterRows', () => {
  it('returns every row without filters', () => {
    expect(filterRows(rows, {})).toEqual(rows);
  });

  it('filters by field, status and reaction', () => {
    expect(numbers(filterRows(rows, { field: 'Health' }))).toEqual(['2026/0001', '2026/0002']);
    expect(numbers(filterRows(rows, { status: 'InProgress' }))).toEqual(['2026/0001', '2026/0003']);
    expect(numbers(filterRows(rows, { reaction: 'NoReaction' }))).toEqual(['2026/0002']);
  });

  it('matches a reaction given to any party in the case', () => {
    expect(numbers(filterRows(rows, { reaction: 'SelfAssessment' }))).toEqual(['2026/0001']);
    expect(numbers(filterRows(rows, { reaction: 'Prohibition' }))).toEqual([
      '2026/0001',
      '2026/0003',
    ]);
  });

  it('combines filters: a row must match all of them', () => {
    expect(numbers(filterRows(rows, { field: 'Health', reaction: 'Prohibition' }))).toEqual([
      '2026/0001',
    ]);
    expect(filterRows(rows, { field: 'Social', status: 'Closed' })).toEqual([]);
  });

  it('never matches a restricted row (Admin) on reaction', () => {
    const restricted: OverviewRow = {
      access: 'restricted',
      id: healthOpen.id,
      caseNumber: healthOpen.caseNumber,
      field: healthOpen.field,
      status: healthOpen.status,
      departmentId: healthOpen.departmentId,
      assignedCaseWorker: null,
    };

    expect(filterRows([restricted], { reaction: 'Prohibition' })).toEqual([]);
    expect(filterRows([restricted], { field: 'Health' })).toEqual([restricted]);
  });
});

describe('F-003 parseFilters', () => {
  it('reads the filters from the address', () => {
    expect(
      parseFilters(new URLSearchParams('field=Social&status=Closed&reaction=Prohibition')),
    ).toEqual({
      field: 'Social',
      status: 'Closed',
      reaction: 'Prohibition',
    });
  });

  it('ignores unknown values and other parameters', () => {
    expect(
      parseFilters(new URLSearchParams('field=Space&status=&reaction=Warning&page=2')),
    ).toEqual({});
  });

  it('hasFilters tells whether any filter is set', () => {
    expect(hasFilters({})).toBe(false);
    expect(hasFilters({ status: 'Closed' })).toBe(true);
  });
});
