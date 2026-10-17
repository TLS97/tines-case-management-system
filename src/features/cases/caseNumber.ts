// Case numbers (SPEC.md "Case number"): `yyyy/nnnn`, the year the case is created and a sequence
// zero-padded to 4 digits. The sequence starts at 0001 every year and is shared by all
// departments, so no two cases get the same number.

const SEQUENCE_DIGITS = 4;

/** The number after `lastSequence` in `year`. Example: nextCaseNumber(2026, 41) is '2026/0042'. */
export function nextCaseNumber(year: number, lastSequence: number): string {
  const sequence = String(lastSequence + 1).padStart(SEQUENCE_DIGITS, '0');
  return `${year}/${sequence}`;
}

/** The highest sequence used in `year` (0 when the year has no cases yet). */
export function lastSequenceInYear(caseNumbers: readonly string[], year: number): number {
  let last = 0;
  for (const caseNumber of caseNumbers) {
    const [caseYear, sequence] = caseNumber.split('/');
    if (Number(caseYear) === year) last = Math.max(last, Number(sequence));
  }
  return last;
}
