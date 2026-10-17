# Testing

| Level | Tool | What |
|---|---|---|
| Unit | Vitest | Pure logic: `can()`, case number generation, filters |
| Component | Testing Library (jsdom) | Forms and tables, queried by role/label |
| E2E | Playwright (Chromium only for now) | One happy path per feature ID |

## Where things live
- Unit and component tests: next to the file, `*.test.ts(x)` in `src/`. Run with `npm run test`.
- Shared Vitest setup and test helpers (factories like `makeUser`): `src/test/`.
  `renderRoute(path)` renders the app at an address with the real routes and providers.
  `makeUser`, `makeCase`, `makeHealthPersonnel` and `makeCompany` (`src/test/factories.ts`) build valid fake data;
  every result is checked against its schema. `actAs(email)` (`src/test/mockUsers.ts`) makes the mock API act as a
  seed user, like the user switcher. `storeCases(...)` (`src/test/mockCases.ts`) puts cases into the mock data.
- Unit and component tests fail on any `console.error` (React key warnings, failed renders), like the e2e check.
  A test that expects an error silences it with `vi.spyOn(console, 'error').mockImplementation(() => {})`.
- The e2e console check fails on any error or warning. A test that expects one (for example the browser's
  "Failed to load resource … 403" line when it opens a forbidden case) declares it with
  `test.use({ expectedConsoleErrors: [failedRequestLine(403)] })`.
- E2E tests: `tests/e2e/*.spec.ts`. Run with `npm run test:e2e`; the first time, run `npm run test:e2e:install` to download Chromium.

## Rules
- Every permission row in SPEC.md has a test for each role.
- Query by accessible role/label, never by CSS class.
- Use the MSW mock API, not hand-rolled fetch mocks. Vitest runs the same handlers (`src/mocks/node.ts`),
  fails on unhandled API requests, and starts every test from the seed data (`localStorage` is cleared).
- E2E tests open pages with `gotoApp(page, path)`, which waits until the app (and so the mock API) is ready.
  They run on their own dev server on port 5174, so they never reuse the one you run on 5173.
- jsdom lacks `<dialog>` and `document.getAnimations()`; `src/test/setup.ts` has small stand-ins.
  Behaviour that depends on them is checked in the e2e tests.
- E2E tests import `test` and `expect` from `tests/e2e/fixtures.ts`, not from `@playwright/test`.
  The fixture fails a test on any browser console error or warning. ESLint enforces this import in `*.spec.ts` files.
- Every Playwright page test calls `expectNoAccessibilityViolations(page)` (axe, WCAG 2.1 AA); violations fail the test.
  It first waits for fade-ins and other finite animations to finish, since half-transparent colours mid-animation
  would show as contrast errors (seen on the slower CI machines).
- Coverage: at least 80% lines for feature logic: `.ts` files in `src/features/**` (hooks, `api.ts`, `permissions.ts`),
  not counting `types.ts`, `index.ts` and tests. Components are covered by component tests instead.
  Before any feature code exists there is nothing to measure, and the check passes.
- Browsers: Chromium only for now. Add Firefox and WebKit in `playwright.config.ts` before release.

## CI (runs on every PR and on pushes to main)
GitHub Actions, `.github/workflows/ci.yml`. Three jobs run in parallel; each is a required check on `main`.

| Job | Steps |
|---|---|
| **Checks** | `npm ci` (lockfile must match), `npm run lint`, `npm run typecheck`, `npm run format:check`, `npm run test -- --coverage` (fails under threshold), `npm run build` |
| **E2E** | `npm ci`, install Chromium, `npm run test:e2e` (incl. axe and console checks); the Playwright report is uploaded when it fails |
| **Audit** | `npm audit --audit-level=high` (reads the lockfile) |

In CI, Playwright retries a failed test up to 2 times and records a trace; retried tests are marked "flaky".

## Example
```ts
describe('F-004 permissions', () => {
  it('lets a leader assign cases in own department only', () => {
    const leader = makeUser({ role: 'Leader', departmentId: 1 });
    expect(can(leader, 'assignCase', makeCase({ departmentId: 1 }))).toBe(true);
    expect(can(leader, 'assignCase', makeCase({ departmentId: 2 }))).toBe(false);
  });
});

describe('F-001 create case', () => {
  it('generates case number yyyy/nnnn', () => {
    expect(nextCaseNumber(2026, 41)).toBe('2026/0042');
  });
});
```
