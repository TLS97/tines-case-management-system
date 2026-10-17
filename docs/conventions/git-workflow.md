# Git workflow

- `main` is always deployable; no direct pushes.
- One branch and one PR per build-plan task (`T2.1`, see BUILD_PLAN.md). Aim for under ~400 changed lines.
- Branch names: `feature/T2.1-F-001-create-case`, `fix/T3.2-F-003-filter-reset`; Phase 0: `chore/T0.1-scaffold`.
- PR title starts with the task ID and feature ID(s): `T2.1 F-001: Create case`. Phase 0: `T0.1: Scaffold app`.
- Conventional commits: `feat(cases): set case number on create (F-001)`.
- PR checklist: lint, typecheck, tests green; SPEC.md updated if behaviour changed;
  docs updated per `documentation.md`.
- Squash merge, done by Tine. Claude never merges.
- Use the PR template (`.github/pull_request_template.md`). **Assumptions** and **Spec changes** are required.
- UI changes include screenshots.

## GitHub accounts
- Repository: [TLS97/tines-case-management-system](https://github.com/TLS97/tines-case-management-system) (public)
- Claude's account: `TinesClaudeAssistant`, commit email `343986177+TinesClaudeAssistant@users.noreply.github.com`
- Claude works through its own GitHub account (not Tine's), so Claude's PRs have a different author
  and Tine can approve them.
- That account has **write** access to the repository, not admin. It cannot change branch protection or settings.
- Claude Code uses that account's token (`gh auth login` with the Claude account). Tine's own token is never used by Claude.

## Branch protection on `main` (set up in T0.8)
Needs a public repository, or GitHub Pro for a private one (GitHub Free only protects branches in public repositories).
- Pull request required, 1 approval (Tine)
- Required status checks: **Checks**, **E2E** and **Audit** (the jobs in `.github/workflows/ci.yml`); branch must be up to date
- No force pushes, no deletion
- Applies to admins too

## Dependabot
- Weekly on Mondays (`.github/dependabot.yml`): one PR for minor and patch updates, one per major update,
  one for the `@digdir/*` packages together, and one for GitHub Actions.
- Major updates of TypeScript, ESLint and `@types/node` are ignored on purpose (decision 0006).
- Dependabot PRs go through CI and Tine's review like any other PR. After a Designsystemet update,
  bump the generator version in the `tokens` script and run it (decision 0007).

## Who does what
| Step | Who |
|---|---|
| Pick the next build-plan task ("start T2.1") | Tine |
| Branch, code, tests, docs, open PR | Claude |
| Review, request changes, approve, merge | Tine |
| Fix review comments on the same branch | Claude |
| Review and merge Dependabot PRs | Tine |
