# 0004 Data fetching with TanStack Query
**Date:** 2026-10-17  **Status:** accepted

## Context
Data fetching lives in hooks (`useCase(id)`). After an edit, the case detail page and the overview must show fresh data.

## Decision
TanStack Query. Feature hooks wrap `useQuery` / `useMutation` around the calls in `features/*/api.ts`.

## Alternatives
Plain `fetch` in `useEffect` (manual loading, error and refresh handling); SWR (fewer mutation features).

## Consequences
Caching, loading and error states and refetching after changes come built in. Swapping the mock API
for a real API later only changes `api.ts`.
