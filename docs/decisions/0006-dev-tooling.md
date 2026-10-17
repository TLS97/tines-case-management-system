# 0006 Development tooling
**Date:** 2026-10-17  **Status:** accepted

## Context
Testing and linting need a few packages beyond those in 0001.

## Decision
- Core: `eslint` + `@eslint/js`, `prettier`, `@types/node` (types for `vite.config.ts`)
- Versions held back so the tools work together (checked 2026-10-17):
  - TypeScript 6.0, not 7: `typescript-eslint` supports TypeScript below 6.1 only
  - ESLint 9, not 10: `eslint-plugin-jsx-a11y` supports ESLint 9 at most. ESLint 9 is no longer
    supported upstream, so revisit when jsx-a11y supports ESLint 10. Tine chose to stay on ESLint 9
    (2026-10-17) rather than switch to the `eslint-plugin-jsx-a11y-x` fork
- Testing: `jsdom` (DOM for component tests, chosen by Tine over happy-dom and Vitest browser mode),
  `@testing-library/dom` (required by `@testing-library/react`), `@testing-library/user-event`, `@testing-library/jest-dom`, `@vitest/coverage-v8`, `@axe-core/playwright`
- Lint: `typescript-eslint`, `eslint-plugin-react-hooks`, `eslint-plugin-jsx-a11y`
- Feature boundaries: ESLint's built-in `no-restricted-imports` (no extra plugin)
- GUIDs: built-in `crypto.randomUUID()` (no package)

## Alternatives
`eslint-plugin-boundaries` (more power than needed); `uuid` package (not needed in modern browsers).

## Consequences
Accessibility problems are caught both in lint and in e2e tests. Dev dependencies only; nothing extra ships to users.
