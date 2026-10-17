# Architecture *(update as built)*

## Layers
Built so far: app shell, routes, the mock API with users, cases and the audit log, the current user, `can()`, and
creating a case (F-001), the case detail page with assigning, closing and reopening, and editing field, health personnel, companies and
reactions (F-001, F-002, F-004).
Everything else is *(planned)*.

```mermaid
flowchart TD
  Main[main.tsx: fonts, Designsystemet CSS, theme] --> App[app/App.tsx: QueryClientProvider + RouterProvider]
  App --> Routes[app/routes.tsx]
  Routes --> Layout[AppLayout: SkipLink, AppHeader, main]
  Layout --> Pages[Pages in features/*/pages]
  Pages --> Components["Feature components (planned)"]
  Components --> DS[Designsystemet components]
  Components --> Hooks["Hooks: useCase, useOverview, ... (planned)"]
  Hooks --> Api["features/*/api.ts (planned)"]
  Api --> Mock["MSW mock API (mocks/handlers)"]
  Mock --> Store["mocks/db.ts: localStorage, seed data, audit log"]
  Mock --> Audit["mocks/auditLog.ts: recordAudit"]
  Main --> Worker["mocks/browser.ts: startMockApi()"]
  Hooks --> Perm["auth/permissions.ts: can"]
```

## Routes
| Route | Page | Feature | Built |
|---|---|---|---|
| `/` | Case overview (`CaseOverviewPage`) | F-003 | Table per role; "New case" for leaders; filters *(planned, T3.2)* |
| `/cases/new` | New case, Leader only (`NewCasePage`) | F-001 | Yes |
| `/cases/:id` | Case detail; assign, read access and per-case audit log for Leader; restricted view for Admin (`CaseDetailPage`) | F-002, F-004, F-005 | Read-only view, restricted view for Admin, assign and reassign |
| `/admin/users` | User admin: add, deactivate, change fields and department (`UsersPage`) | F-004 | Empty page |
| `/admin/audit` | Global audit log (`AuditLogPage`) | F-005 | Empty page |
| any other | Page not found (`NotFoundPage`) | – | Yes |

The main navigation links to Cases, Users and Audit log. Hiding links by role comes with `can()` (F-004).
A mock-only **Test environment** bar above the header holds the user switcher ("Acting as") and **Reset mock data**.

## Mock API
| Endpoint | What it does |
|---|---|
| `GET /api/current-user` | The user the app acts as |
| `GET /api/cases` | The cases the user may see, newest first (F-003); restricted rows without reactions for Admin |
| `POST /api/cases` | Create a case, body `{ field }` (F-001); 403 and a Denied audit entry if not allowed |
| `GET /api/cases/:id` | Open a case: full, or restricted for Admin (F-002, F-004); 403 + Denied entry without access; 404 if missing; logs "case opened" |
| `GET /api/cases/:id/eligible-case-workers` | Case workers the case can be assigned to (F-004, leaders) |
| `PUT /api/cases/:id/assignee` | Assign or reassign, body `{ caseWorkerId }` (F-004); returns the updated case |
| `PATCH /api/cases/:id/field` | Change the field, body `{ field }` (F-002, assigned case worker) |
| `POST /api/cases/:id/health-personnel` | Add a health personnel (F-002); 409 if the number is already on the case |
| `DELETE /api/cases/:id/health-personnel/:personId` | Remove a health personnel (F-002) |
| `POST /api/cases/:id/companies` | Add a company (F-002); 409 if the organization number is already on the case |
| `DELETE /api/cases/:id/companies/:companyId` | Remove a company (F-002) |
| `PUT /api/cases/:id/health-personnel/:personId/reaction` | Give a health personnel a reaction, body `{ reaction }` (F-002) |
| `PUT /api/cases/:id/companies/:companyId/reaction` | Give a company a reaction, body `{ reaction }` (F-002) |
| `POST /api/cases/:id/close` | Close the case (F-002, assigned case worker); 409 if a party has no reaction or there are none |
| `POST /api/cases/:id/reopen` | Reopen a closed case (F-004, leader); it becomes In progress |
| `GET /api/mock/users` | All users (mock only; for the user switcher) |
| `PUT /api/mock/current-user` | Act as another user, body `{ userId }` (mock only) |
| `POST /api/mock/reset` | Replace all data with the seed data (mock only) |

## Current user
`useCurrentUser()` (from `@/features/auth`) returns the user the app acts as. It always returns a user:
while it loads, the `<Suspense>` around every page in `AppLayout` shows a spinner. The current user is
stored by the mock API (in `localStorage`), so the choice survives a reload, and the mock API can use it
for permission checks.

Switching user or resetting the mock data drops all cached data except the current user, then updates the
current user; each part of the page still shown for the new user loads its own data. (Refetching everything at once
would load the previous user's data as the new user, for example a leader's assign list as a case worker.)

A change to a case (assigning, later editing) updates the page from the mock API's response instead of refetching
the case, since every fetch of a case is logged as "case opened".

Permission-checked endpoints for cases and users come with their features. All calls go through
`apiRequest` (`shared/api/apiRequest.ts`), which checks responses with a Zod schema.

## App shell
```mermaid
flowchart TD
  Root["Root route: AppLayout (ErrorBoundary: RootErrorPage)"] --> Inner["Pathless route (ErrorBoundary: RouteErrorPage)"]
  Inner --> P1[CaseOverviewPage]
  Inner --> P2[NewCasePage]
  Inner --> P3[CaseDetailPage]
  Inner --> P4[UsersPage]
  Inner --> P5[AuditLogPage]
  Inner --> NF[NotFoundPage]
```
- **Errors:** a failing page shows "Something went wrong" inside the shell, so the header stays.
  If the shell itself fails, `RootErrorPage` renders it again around the message. Error details are never shown.
- **Page titles and focus:** every page uses `Page` (`shared/components/Page.tsx`), which sets the document title
  and renders the h1. After client-side navigation, `AppLayout` moves focus to the new h1.
  See [decision 0009](decisions/0009-page-titles-and-focus.md).
- **Skip link:** "Skip to main content" is the first focusable element and jumps to `<main id="main-content">`.

## Folders
See [folder-structure.md](conventions/folder-structure.md).
