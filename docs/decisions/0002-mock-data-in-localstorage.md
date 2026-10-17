# 0002 Mock data saved in localStorage
**Date:** 2026-10-17  **Status:** accepted

## Context
MSW keeps data in memory, so everything is lost on page reload. Tine needs data to survive a reload.

## Decision
- The MSW handlers read and write cases, users and the audit log in `localStorage`.
- Seed data is loaded when `localStorage` is empty; a mock-only **Reset mock data** action reloads it.
- No extra library; a small storage module in `src/mocks`.

## Alternatives
IndexedDB (more setup than needed for small mock data); in-memory only (loses data on reload).

## Consequences
Data stays between reloads and is easy to reset. Tests must clear `localStorage` before each test.
Data lives in one browser only, which is fine for v1.
