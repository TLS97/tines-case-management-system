# Onboarding

## Run the app
Needs Node 24 or newer.
```bash
npm install
npm run dev        # app with mock API
npm run lint       # ESLint
npm run typecheck  # TypeScript
npm run format     # Prettier
npm run tokens     # regenerate the theme after changing designsystemet.config.json
npm run test       # unit and component tests
npm run test:e2e   # Playwright e2e + accessibility (first time: npm run test:e2e:install)
```
v1 has no backend; all data comes from the mock API and is saved in `localStorage`, so it survives a reload.
You start as the seed user Tine Tester (CaseWorker, Department of Supervision, Health).
Use the user switcher in the header to act as any seed user listed in SPEC.md, for example a Leader to create cases.
Use **Reset mock data** in the header to go back to the seed data.

## Read in this order
1. [PROJECT_PLAN.md](../PROJECT_PLAN.md): what we're building and why
2. [roadmap.md](roadmap.md): features, phases and statuses at a glance
3. [SPEC.md](../SPEC.md): domain, roles and permissions
4. [domain-model.md](domain-model.md) and [case-lifecycle.md](case-lifecycle.md)
5. [architecture.md](architecture.md)
6. `docs/features/`: one page per feature
7. `docs/conventions/`: code style, folders, testing, git, documentation
