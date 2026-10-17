import { describe, expect, it } from 'vitest';
import { formatDate } from './formatDate';

describe('formatDate', () => {
  it('formats an ISO date as day, short month and year', () => {
    expect(formatDate('2026-01-31')).toBe('31 Jan 2026');
  });

  it('keeps the calendar day (no time zone shift)', () => {
    expect(formatDate('2020-01-01')).toBe('1 Jan 2020');
  });

  it('returns anything that is not an ISO date unchanged', () => {
    expect(formatDate('not a date')).toBe('not a date');
  });
});
