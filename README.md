# Case management for supervision cases

A web frontend for handling supervision cases against health personnel and companies.
Leaders create cases and assign them to case workers in their department, case workers handle
the cases and give reactions, and admins manage users and follow the audit log.

> **Status:** early development (Phase 0, foundation). There is no backend yet: the app runs
> against a mock API in the browser, and all data is fake.

Built with React, TypeScript and [Designsystemet](https://designsystemet.no) (Digdir).

## Getting started
Requires Node 24 or newer.

```bash
npm install
npm run test:e2e:install   # once: downloads Chromium for the end-to-end tests
npm run dev                # starts the app at http://localhost:5173
```

## Commands
| Command | What it does |
|---|---|
| `npm run dev` | Start the app |
| `npm run build` | Type check and build for production |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript |
| `npm run format` | Prettier (code only, not Markdown) |
| `npm run test` | Unit and component tests (Vitest); add `-- --coverage` for coverage |
| `npm run test:e2e` | End-to-end and accessibility tests (Playwright, Chromium) |
| `npm run tokens` | Regenerate the theme from `designsystemet.config.json` |

## Documentation
Start with [docs/onboarding.md](docs/onboarding.md). The most important documents:

| Document | What it covers |
|---|---|
| [PROJECT_PLAN.md](PROJECT_PLAN.md) | Why, scope, phases, risks |
| [SPEC.md](SPEC.md) | Domain model, roles and permissions, acceptance criteria per feature |
| [BUILD_PLAN.md](BUILD_PLAN.md) | Build phases and tasks, in order |
| [docs/roadmap.md](docs/roadmap.md) | All features, phases and statuses at a glance |
| [docs/architecture.md](docs/architecture.md) | Layers, routes and folders |
| [docs/conventions/](docs/conventions/) | Code style, folders, testing, git, security, documentation, definition of done |
| [docs/decisions/](docs/decisions/) | Log of technical decisions |
| [CLAUDE.md](CLAUDE.md) | Rules for Claude Code, which writes most of the code |

## How work is done
Each task in [BUILD_PLAN.md](BUILD_PLAN.md) is one branch and one pull request. Claude Code
implements the task, with tests and docs, and opens the PR; the project owner reviews and
squash-merges it. See [docs/conventions/git-workflow.md](docs/conventions/git-workflow.md).
