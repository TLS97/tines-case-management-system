# 0003 Routing with React Router
**Date:** 2026-10-17  **Status:** accepted

## Context
The app needs client-side routes for overview, new case, case detail and admin pages (see `docs/architecture.md`).

## Decision
React Router, used in data mode (`createBrowserRouter` + `RouterProvider`), not as a framework.
Version 8 since T0.4 (the decision was written for v7; v8 became the current version in June 2026).
In v8, `RouterProvider` is imported from `react-router/dom`, everything else from `react-router`.

## Alternatives
TanStack Router (good type safety, smaller community); no router (not realistic with several pages).

## Consequences
Widely used and well documented. Route params (`/cases/:id`) are strings and must be checked before use.
