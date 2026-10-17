# Security and data

The app handles information about health personnel and supervision cases. Treat all of it as sensitive.

## Data
- Mock and test data are clearly fake: generated names, `example.com` emails, health personnel
  and organization numbers from obviously invalid ranges. Never copy real data in.
- Don't log case or personal data to the console.
- The mock API saves data in `localStorage`. Only fake data may ever be stored there.
- MSW request logging stays off (`quiet: true`), and `ApiError` messages never include response bodies.
- Admin gets the restricted case view: the mock API leaves out the sensitive case data listed in SPEC.md,
  so it never reaches the browser for Admin. Hiding it only in the UI is not enough.
  The view is an allowlist (`toRestrictedCase`); a new case field is hidden from Admin until it is added to
  `ADMIN_VISIBLE_FIELDS` on purpose.
- Audit log `details` never contain sensitive case data. `recordAudit` refuses details that equal or contain a
  sensitive value from the case (see `docs/features/F-005-audit-log.md`); refer to parties by id.
- The Excel export (F-007) only includes fields listed as non-sensitive in SPEC.md.

## Code
- No secrets, tokens or credentials in the repo. Use `.env.local` (git-ignored) if ever needed.
- Never use `dangerouslySetInnerHTML`, `eval` or building HTML from strings.
- Validate all form input (types, lengths, formats such as dates and organization numbers).
- All permission checks go through `can()`. Frontend checks are for the UI only;
  a future backend must enforce the same rules.
- Every action listed under F-005 Audit log in SPEC.md writes an audit entry.

## CI
- GitHub Actions are pinned to full commit ids, not tags, so a moved tag cannot change what runs. Dependabot updates them.
- The workflow only has read access to the repository (`permissions: contents: read`), and checkout does not keep the token.

## Dependencies
- Ask before adding a package, and add a decision file explaining why.
- Prefer well-maintained packages with many users; avoid packages for trivial helpers.
- Commit `package-lock.json`; CI uses `npm ci`.
- Dependabot opens update PRs; Tine reviews them like any other PR.
- `npm audit --audit-level=high` must pass in CI.
