# Build plan

Do phases in order, and tasks in order within a phase. Each task (`T<phase>.<n>`) is one branch and one PR.
A task may only be built if every feature it touches has status **Approved** or **In progress** in SPEC.md,
and only after Tine says to start it ("start T2.1"). Phase 0 has no features.
Each phase ends when all its tasks are merged and its **Done when** is true.

## Phase 0: Foundation
- [ ] **T0.1** `git init` in this folder with `.gitignore` and a repo-local git identity for the Claude GitHub account;
      commit the existing docs to `main` and push it (the only direct push to `main`, done with Tine's OK);
      then, on a branch: scaffold Vite + React + TypeScript (strict mode), latest stable deps, `@/` path alias;
      ESLint (typescript-eslint, react-hooks, jsx-a11y, `no-restricted-imports` for feature boundaries) and Prettier
- [ ] **T0.2** Vitest + Testing Library (+ user-event, jest-dom, coverage-v8) and Playwright + `@axe-core/playwright`, one smoke test each
- [ ] **T0.3** Install `@digdir/designsystemet-react` and `@digdir/designsystemet-css`; generate theme tokens
      from `designsystemet.config.json` into `./design-tokens`
      (theme `htil-theme`, colors `accent #E2F1E9`, `htil-hovedfarge #053227`,
      `htil-sekundaerfarge #20B89A`, `neutral #FFFFFF`, border radius 4)
- [ ] **T0.4** App shell: header, navigation, React Router routes (empty pages), error boundary, TanStack Query provider
- [ ] **T0.5** Mock API layer (MSW) with data saved in `localStorage`, the seed users from SPEC.md and **Reset mock data**
- [ ] **T0.6** Current-user context and the user switcher in the header (mock only)
- [ ] **T0.7** CI as described in `docs/conventions/testing.md` (lint, types, tests, e2e + axe, build, audit), Dependabot,
      PR template, `.claude/settings.json` from `docs/templates/claude-settings.json`
- [ ] **T0.8** *(Tine)* GitHub: branch protection on `main` and the Claude GitHub account, per `docs/conventions/git-workflow.md`
- **Done when:** `npm run dev` shows the themed shell, the user switcher works and survives a reload, CI runs all checks, `main` is protected

## Phase 1: Access core (F-004, F-005)
- [ ] **T1.1** Domain types from SPEC.md (`SupervisionCase`, `User`, `Role`, `CaseStatus`, reactions, `DepartmentId`, ...)
- [ ] **T1.2** `can(user, action, case?)` for every row in the SPEC.md permission table, with a test per row and role (F-004)
- [ ] **T1.3** Restricted case view: function that removes sensitive case data for Admin, with tests (F-004)
- [ ] **T1.4** Audit log writing in the mock API: entries saved in `localStorage`, `Success` and `Denied`, no sensitive data (F-005)
- **Done when:** the whole permission table is covered by tests, and the mock API can write audit entries. No screens yet.

## Phase 2: Case flow (F-001, F-002, F-004)
- [ ] **T2.1** Create case (Leader): mock endpoint with the case number sequence, "New case" page (F-001)
- [ ] **T2.2** Case detail page, read-only, including the Admin restricted view; "case opened" is logged (F-002, F-004)
- [ ] **T2.3** Assign and reassign a case (Leader) (F-004)
- [ ] **T2.4** Edit field; add and remove health personnel with authorizations; `InProgress` on first change (F-002)
- [ ] **T2.5** Add and remove companies with address (F-002)
- [ ] **T2.6** Reactions for health personnel and companies (F-002)
- [ ] **T2.7** Close case (case worker) and reopen case (Leader) (F-002, F-004)
- **Done when:** a leader can create and assign a case, the case worker can expand and close it, the leader can
  reopen it, data survives a reload, and every action is in the audit log storage

## Phase 3: Overview and admin (F-003, F-004, F-005)
- [ ] **T3.1** Case overview table, showing the right cases for each role (F-003)
- [ ] **T3.2** Overview filters: field, status, reaction; combine and clear; empty message (F-003)
- [ ] **T3.3** Give and remove read access (Leader) (F-004)
- [ ] **T3.4** User admin: list and add users (Admin) (F-004)
- [ ] **T3.5** User admin: deactivate a user; deactivated case workers stay on their cases, shown as "(deactivated)" (F-004)
- [ ] **T3.6** User admin: change a user's fields and department (Admin) (F-004).
      *Blocked until Tine answers what happens to that user's open cases.*
- [ ] **T3.7** Audit log per case (Leader) (F-005)
- [ ] **T3.8** Global audit log with filters (Admin) (F-005)
- **Done when:** F-001 to F-005 meet all acceptance criteria, each has an e2e happy path, and all are **Done** in SPEC.md

## Phase 4: Follow-up (F-010, F-011)
## Phase 5: Notifications (F-012)
## Phase 6: Word/Excel (F-006, F-007), applications (F-008, F-009)
