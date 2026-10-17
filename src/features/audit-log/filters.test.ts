import { describe, expect, it } from 'vitest';
import { hasAuditLogFilters, parseAuditLogFilters, toSearchParams } from './filters';

// F-005 (T3.8): the global audit log filters in the page address.

describe('F-005 audit log filters', () => {
  const userId = crypto.randomUUID();

  it('reads every filter from the address, and writes it back the same way', () => {
    const params = new URLSearchParams({
      case: '2026/0001',
      action: 'CaseOpened',
      userId,
      result: 'Denied',
      from: '2026-10-01',
      to: '2026-10-31',
    });

    const filters = parseAuditLogFilters(params);

    expect(filters).toEqual({
      case: '2026/0001',
      action: 'CaseOpened',
      userId,
      result: 'Denied',
      from: '2026-10-01',
      to: '2026-10-31',
    });
    expect(toSearchParams(filters).toString()).toBe(params.toString());
    expect(hasAuditLogFilters(filters)).toBe(true);
  });

  it('accepts a case id as well as a case number', () => {
    const caseId = crypto.randomUUID();

    expect(parseAuditLogFilters(new URLSearchParams({ case: caseId }))).toEqual({ case: caseId });
  });

  it('ignores unknown or invalid values', () => {
    const filters = parseAuditLogFilters(
      new URLSearchParams({
        case: '26/1',
        action: 'CaseDeleted',
        userId: 'lars',
        result: 'Maybe',
        from: '2026-13-01',
        to: 'yesterday',
      }),
    );

    expect(filters).toEqual({});
    expect(hasAuditLogFilters(filters)).toBe(false);
    expect(toSearchParams(filters).toString()).toBe('');
  });
});
