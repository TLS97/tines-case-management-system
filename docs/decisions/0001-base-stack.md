# 0001 Base stack
**Date:** 2026-10-17  **Status:** accepted

## Context
New React frontend. No backend exists yet; UI must use Designsystemet.

## Decision
- React + TypeScript (strict), built with Vite
- Designsystemet (`@digdir/designsystemet-react`, `-css`) with the `htil-theme` tokens
- MSW as the mock API for all of v1
- Vitest + Testing Library for unit/component tests, Playwright + axe for e2e and accessibility
- English UI text

## Alternatives
Next.js (server features not needed without a backend); Jest (slower, more config with Vite).

## Consequences
Easy to swap MSW for a real API later, since all calls go through `features/*/api.ts`.
