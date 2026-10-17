# 0002 Mock data saved in localStorage
**Date:** 2026-10-17  **Status:** accepted

## Context
MSW keeps data in memory, so everything is lost on page reload. Tine needs data to survive a reload.

## Decision
- The MSW handlers read and write cases, users and the audit log in `localStorage`.
- Seed data is loaded when `localStorage` is empty; a mock-only **Reset mock data** action reloads it.
- No extra library; a small storage module, `src/mocks/db.ts`, under the key `sak.mockDb`.
  It also stores which user the app acts as (`currentUserId`, version 2 since T0.6), so a reset goes back to Tine Tester,
  the audit log (`auditLog`, version 3 since T1.4) and cases (`cases`, version 4 since T2.1).
- Stored data is checked with the Zod schemas when read. Invalid JSON or data that no longer matches
  (for example after a schema change) is replaced by the seed data, so the app never runs on broken data.
- MSW 3 runs as a service worker with the classic setup (`public/mockServiceWorker.js` + `setupWorker`),
  in development and in production builds. MSW's new Vite plugin is not used, since it leaves the mock API
  out of production builds. The app waits for the worker before it renders.
- Request logging is off (`quiet: true`), so no case or personal data is printed to the console.
  An unhandled request to `/api/` is an error; other requests (app files, fonts) pass through.

## Alternatives
IndexedDB (more setup than needed for small mock data); in-memory only (loses data on reload).

## Consequences
Data stays between reloads and is easy to reset. Vitest clears `localStorage` before each test; each Playwright test
starts with an empty browser profile.
Data lives in one browser only, which is fine for v1.
