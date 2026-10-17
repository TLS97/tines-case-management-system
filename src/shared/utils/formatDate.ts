const DATE_FORMAT = new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium' });

/**
 * Formats an ISO date (`2026-01-31`) for display ("31 Jan 2026"). The date is read as a calendar day,
 * not a moment in UTC, so it never shifts a day because of the time zone.
 */
export function formatDate(isoDate: string): string {
  const [year, month, day] = isoDate.split('-').map(Number);
  if (!year || !month || !day) return isoDate;
  return DATE_FORMAT.format(new Date(year, month - 1, day));
}
