import { describe, expect, it } from 'vitest';
import { formatDate, formatDateTime, toLocalDate } from './formatDate';

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

describe('formatDateTime', () => {
  it('formats a moment as date and time in the user’s time zone', () => {
    const moment = new Date(2026, 9, 17, 14, 3).toISOString();

    expect(formatDateTime(moment)).toBe('17 Oct 2026, 14:03');
  });
});

describe('toLocalDate', () => {
  it('gives the calendar day in the user’s time zone, also just before and after midnight', () => {
    expect(toLocalDate(new Date(2026, 9, 17, 0, 0).toISOString())).toBe('2026-10-17');
    expect(toLocalDate(new Date(2026, 9, 17, 23, 59).toISOString())).toBe('2026-10-17');
  });
});
