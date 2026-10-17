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
- E2E tests: `tests/e2e/*.spec.ts`. Run with `npm run test:e2e`; the first time, run `npm run test:e2e:install` to download Chromium.

## Rules
- Every permission row in SPEC.md has a test for each role.
- Query by accessible role/label, never by CSS class.
- Use the MSW mock API, not hand-rolled fetch mocks. Vitest runs the same handlers (`src/mocks/node.ts`),
  fails on unhandled API requests, and starts every test from the seed data (`localStorage` is cleared).
- E2E tests open pages with `gotoApp(page, path)`, which waits until the app (and so the mock API) is ready.
- E2E tests import `test` and `expect` from `tests/e2e/fixtures.ts`, not from `@playwright/test`.
  The fixture fails a test on any browser console error or warning. ESLint enforces this import in `*.spec.ts` files.
- Every Playwright page test calls `expectNoAccessibilityViolations(page)` (axe, WCAG 2.1 AA); violations fail the test.
- Coverage: at least 80% lines for feature logic: `.ts` files in `src/features/**` (hooks, `api.ts`, `permissions.ts`),
  not counting `types.ts`, `index.ts` and tests. Components are covered by component tests instead.
  Before any feature code exists there is nothing to measure, and the check passes.
- Browsers: Chromium only for now. Add Firefox and WebKit in `playwright.config.ts` before release.

## CI (runs on every PR)
1. `npm ci` (lockfile must match)
2. `npm run lint`, `npm run typecheck` and `npm run format:check`
3. `npm run test -- --coverage` (fails under threshold)
4. `npm run test:e2e` (incl. axe checks)
5. `npm run build`
6. `npm audit --audit-level=high`

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
