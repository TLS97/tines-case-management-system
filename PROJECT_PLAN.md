# Project plan: Supervision case management (frontend)

## Purpose
A React + TypeScript frontend where leaders create supervision cases and distribute
them in their department, case workers handle the cases against health personnel and
companies, and admins manage users and audit activity.

## Scope
**In scope (v1)**
- Create and expand supervision cases (F-001, F-002)
- Case overview with filters (F-003)
- Role-based access: CaseWorker, Leader, Admin (F-004)
- Audit log (F-005)
- Follow-up cases for restrictions of practice (F-010, F-011)
- Leader notifications for unassigned cases (F-012)

**Later / needs description**
- Word document generation (F-006)
- Excel export of non-sensitive data (F-007)
- Applications and applications in overview (F-008, F-009)

**Out of scope**
- Backend/API and real authentication. v1 uses only the mock API; the backend is not
  defined yet, so v1 makes no assumptions about it. The current user comes from mock seed data.

## Phases
Work is planned in build phases only (no separate milestones). Tasks and "done when" for each phase
are in [BUILD_PLAN.md](BUILD_PLAN.md); the overview is in [docs/roadmap.md](docs/roadmap.md).

| Phase | Goal | Features |
|---|---|---|
| 0 | Foundation: app runs, theme applied, CI green | – |
| 1 | Access core: permissions and audit log writing | parts of F-004, F-005 |
| 2 | Case flow: leader creates and assigns, case worker expands and closes | F-001, F-002, part of F-004 |
| 3 | Overview and admin: each role sees the right cases; audit log screens | F-003, rest of F-004, F-005 |
| 4 | Follow-up | F-010, F-011 |
| 5 | Notifications | F-012 |
| 6 | Documents, export and applications | F-006, F-007, F-008, F-009 |

Draft features stay in their phase and get their acceptance criteria refined as we go,
before their phase starts.
