# Definition of done

A task is done only when all of these are true. Claude checks them before asking for review;
Tine checks them when reviewing.

## Behaviour
- [ ] Meets the acceptance criteria in SPEC.md for the feature
- [ ] Permissions follow the table in SPEC.md, checked through `can()`
- [ ] Assumptions and spec changes are listed in the PR

## Quality
- [ ] Lint, typecheck, unit/component tests and e2e tests pass in CI
- [ ] New logic has tests; coverage threshold met
- [ ] No `any`, no disabled lint rules, no skipped tests
- [ ] No errors or warnings in the browser console

## Accessibility (WCAG 2.1 AA)
- [ ] Axe check passes on every changed page
- [ ] Everything works with keyboard only; focus is visible
- [ ] Form fields have labels; errors are shown in text, not only colour
- [ ] Designsystemet components used as intended

## Security and data
- [ ] Follows `security.md`; only fake data in mocks and tests
- [ ] No new dependency without a decision file

## Docs and review
- [ ] Feature page and diagrams updated per `documentation.md`
- [ ] PR template filled in, with screenshots for UI changes
- [ ] Approved and merged by Tine
