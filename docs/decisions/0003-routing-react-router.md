# 0003 Routing with React Router
**Date:** 2026-10-17  **Status:** accepted

## Context
The app needs client-side routes for overview, new case, case detail and admin pages (see `docs/architecture.md`).

## Decision
React Router (v7, used as a client-side library, not as a framework).

## Alternatives
TanStack Router (good type safety, smaller community); no router (not realistic with several pages).

## Consequences
Widely used and well documented. Route params (`/cases/:id`) are strings and must be checked before use.
