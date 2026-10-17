# Architecture *(update as built)*

## Layers
Built so far: app shell, routes, empty pages, the mock API with users, and the current user. Everything else is *(planned)*.

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
  Mock --> Store["mocks/db.ts: localStorage, seed data"]
  Main --> Worker["mocks/browser.ts: startMockApi()"]
  Hooks --> Perm["auth/permissions.ts: can (planned)"]
```

## Routes
| Route | Page | Feature | Built |
|---|---|---|---|
| `/` | Case overview (`CaseOverviewPage`) | F-003 | Empty page |
| `/cases/new` | New case, Leader only (`NewCasePage`) | F-001 | Empty page |
| `/cases/:id` | Case detail; assign, read access and per-case audit log for Leader; restricted view for Admin (`CaseDetailPage`) | F-002, F-004, F-005 | Empty page |
| `/admin/users` | User admin: add, deactivate, change fields and department (`UsersPage`) | F-004 | Empty page |
| `/admin/audit` | Global audit log (`AuditLogPage`) | F-005 | Empty page |
| any other | Page not found (`NotFoundPage`) | – | Yes |

The main navigation links to Cases, Users and Audit log. Hiding links by role comes with `can()` (F-004).
`/cases/new` gets its "New case" button on the overview with F-001.
A mock-only **Test environment** bar above the header holds the user switcher ("Acting as") and **Reset mock data**.

## Mock API
| Endpoint | What it does |
|---|---|
| `GET /api/current-user` | The user the app acts as |
| `GET /api/mock/users` | All users (mock only; for the user switcher) |
| `PUT /api/mock/current-user` | Act as another user, body `{ userId }` (mock only) |
| `POST /api/mock/reset` | Replace all data with the seed data (mock only) |

## Current user
`useCurrentUser()` (from `@/features/auth`) returns the user the app acts as. It always returns a user:
while it loads, the `<Suspense>` around every page in `AppLayout` shows a spinner. The current user is
stored by the mock API (in `localStorage`), so the choice survives a reload, and the mock API can use it
for permission checks. Switching user or resetting the mock data refetches all data.

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
