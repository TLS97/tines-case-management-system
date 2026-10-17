# 0006 Development tooling
**Date:** 2026-10-17  **Status:** accepted

## Context
Testing and linting need a few packages beyond those in 0001.

## Decision
- Testing: `@testing-library/user-event`, `@testing-library/jest-dom`, `@vitest/coverage-v8`, `@axe-core/playwright`
- Lint: `typescript-eslint`, `eslint-plugin-react-hooks`, `eslint-plugin-jsx-a11y`
- Feature boundaries: ESLint's built-in `no-restricted-imports` (no extra plugin)
- GUIDs: built-in `crypto.randomUUID()` (no package)

## Alternatives
`eslint-plugin-boundaries` (more power than needed); `uuid` package (not needed in modern browsers).

## Consequences
Accessibility problems are caught both in lint and in e2e tests. Dev dependencies only; nothing extra ships to users.
