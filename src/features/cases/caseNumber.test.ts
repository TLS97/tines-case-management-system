import { describe, expect, it } from 'vitest';
import { lastSequenceInYear, nextCaseNumber } from './caseNumber';

describe('F-001 case number', () => {
  it('generates case number yyyy/nnnn', () => {
    expect(nextCaseNumber(2026, 41)).toBe('2026/0042');
  });

  it('starts at 0001 in a year without cases', () => {
    expect(nextCaseNumber(2026, lastSequenceInYear([], 2026))).toBe('2026/0001');
  });

  it('continues after the highest number in the year, even if numbers are out of order', () => {
    const numbers = ['2026/0003', '2026/0010', '2026/0007'];

    expect(nextCaseNumber(2026, lastSequenceInYear(numbers, 2026))).toBe('2026/0011');
  });

  it('starts again at 0001 in a new year', () => {
    const numbers = ['2026/0120', '2026/0121'];

    expect(nextCaseNumber(2027, lastSequenceInYear(numbers, 2027))).toBe('2027/0001');
  });

  it('keeps counting past 9999', () => {
    expect(nextCaseNumber(2026, 9999)).toBe('2026/10000');
    expect(lastSequenceInYear(['2026/10000'], 2026)).toBe(10000);
  });
});
