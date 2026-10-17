# CLAUDE.md

Frontend for a supervision case management system. React + TypeScript, UI built
with Designsystemet (Digdir). v1 uses only the mock API in `src/mocks` (MSW), with all data saved in
`localStorage`. The backend is not defined yet; do not design for or guess at a real API or login.
All UI text is in English.

## Read before working
- `SPEC.md` for domain model, permissions and acceptance criteria
- `BUILD_PLAN.md` for the current phase; only work on that phase
- `docs/conventions/*` for style, structure, testing, git, security, documentation
  and the definition of done
- `docs/decisions/` for decisions already made; add one for every new decision

## Commands
- `npm run dev` start app
- `npm run test` unit/component tests (Vitest)
- `npm run test:e2e` Playwright
- `npm run lint` / `npm run typecheck`

## Rules
- Use Designsystemet components (`@digdir/designsystemet-react`) before writing custom UI.
  Never hardcode colors; use theme tokens from `design-tokens/`.
- Permission checks go through `can()` (in `src/features/auth/permissions.ts`, imported from `@/features/auth`); never inline role checks.
- Every feature references its ID (F-001 ...) in tests; PR titles start with the task ID and feature ID (`T2.1 F-001: ...`).
- Update docs in the same PR as the code, per `docs/conventions/documentation.md`
  (feature page, and architecture/domain/lifecycle diagrams when they change).
- Run lint, typecheck and tests before saying a task is done.
- Ask before adding a new dependency.

## Guardrails (never break these)
- Only start implementing a task when Tine says to start that task.
- Only implement features with status **Approved** or **In progress** in the SPEC.md feature table.
  If a task needs a Draft feature, stop and ask Tine. Never build it "partially" and never stub it in.
- Never move a feature from Draft to Approved and never change acceptance criteria. You may only set
  **In progress** in a feature's first PR and **Done** in its last PR (see SPEC.md status rules).
- Never merge a PR, push to `main`, force-push, or rewrite history. Tine reviews and merges.
- Never skip, disable or delete tests, lint rules or type checks to get green.
- Never change CI, `tsconfig` strictness, ESLint config, `design-tokens/` or
  `designsystemet.config.json` without asking first.
- Never change SPEC.md silently. If behaviour must differ from the spec, ask, or
  change it in the PR and call it out under **Spec changes**.
- When the spec is unclear or missing, stop and ask. Do not guess. Any small assumption
  you do make goes in the PR under **Assumptions**.
- Only work on the current build-plan task. Note other problems you find; don't fix them in the same PR.
- Never put real personal data in code, tests or mock data. Use clearly fake data.
- Follow `docs/conventions/definition-of-done.md` before calling a task done.
