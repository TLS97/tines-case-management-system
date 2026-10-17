# 0005 Forms with React Hook Form and Zod
**Date:** 2026-10-17  **Status:** accepted

## Context
F-001, F-002 and F-004 have forms with rules: health personnel number 7–9 digits, organization number
9 digits, `validToDate` on or after `validFromDate`, unique email. The mock API must reject the same invalid input.

## Decision
React Hook Form for form state, Zod for validation schemas, connected with `@hookform/resolvers` (`zodResolver`),
the official adapter (added in T2.1). The same Zod schema is used by the form and by the MSW handler, and to check
data read back from `localStorage`.

## Alternatives
Hand-written validation (rules duplicated between form and mock API); Formik (less maintained).

## Consequences
One place per rule. Form fields must be wired to Designsystemet components so labels and error messages stay accessible.
