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

const DATE_TIME_FORMAT = new Intl.DateTimeFormat('en-GB', {
  dateStyle: 'medium',
  timeStyle: 'short',
});

/** Formats a moment (ISO timestamp) in the user's time zone: "17 Oct 2026, 14:03". */
export function formatDateTime(timestamp: string): string {
  return DATE_TIME_FORMAT.format(new Date(timestamp));
}

/** The calendar day (`2026-10-17`) of a moment (ISO timestamp) in the user's time zone. */
export function toLocalDate(timestamp: string): string {
  const date = new Date(timestamp);
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}
