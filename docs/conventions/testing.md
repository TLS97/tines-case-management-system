# Testing

| Level | Tool | What |
|---|---|---|
| Unit | Vitest | Pure logic: `can()`, case number generation, filters |
| Component | Testing Library | Forms and tables, queried by role/label |
| E2E | Playwright | One happy path per feature ID |

## Rules
- Every permission row in SPEC.md has a test for each role.
- Query by accessible role/label, never by CSS class.
- Use the MSW mock API, not hand-rolled fetch mocks.
- Every Playwright page test runs an axe accessibility check (`@axe-core/playwright`); violations fail the test.
- Coverage: at least 80% lines for `src/features/**` logic (hooks, `api.ts`, `permissions.ts`).

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
