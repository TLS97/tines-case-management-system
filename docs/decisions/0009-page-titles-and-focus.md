# 0009 Page titles and focus after navigation
**Date:** 2026-10-17  **Status:** accepted

## Context
In a single-page app the browser does not reload on navigation. Without extra work, the document title stays the same
and focus stays on the clicked link, so screen reader and keyboard users do not notice that the page changed
(WCAG 2.1: 2.4.2 Page Titled, 2.4.3 Focus Order). React Router leaves this to the app.

## Decision
- Every page renders through `Page` (`src/shared/components/Page.tsx`) with a `title`. It sets the document title to
  `<title> – Case management` (using React 19's built-in `<title>` support) and renders the page's only h1.
- After client-side navigation, `AppLayout` moves focus to the new page's h1 (which has `tabIndex={-1}`).
  On the first page load focus is left alone.
- A Designsystemet `SkipLink` ("Skip to main content") is the first focusable element (WCAG 2.4.1 Bypass Blocks).

## Alternatives
A live region that announces the new page (more moving parts); focusing `<main>` instead of the h1 (screen readers
then read the whole page); a library like react-helmet for titles (not needed with React 19).

## Consequences
New pages must use `Page`. Tested in `src/app/routes.test.tsx` and `tests/e2e/smoke.spec.ts`.
