# Roadmap

One page that shows every feature, which build phase it belongs to, and its status.
Sources: [SPEC.md](../SPEC.md) (status), [BUILD_PLAN.md](../BUILD_PLAN.md) (phases and tasks), [PROJECT_PLAN.md](../PROJECT_PLAN.md) (scope).

## Phases
Green = Approved, blue = In progress, dark green = Done, grey dashed = Draft (criteria refined before its phase starts).
F-004 and F-005 are built in parts across Phases 1–3.

```mermaid
flowchart TD
  subgraph P0["Phase 0 · Foundation"]
    F0[App shell, theme, CI, mock API in localStorage, seed users, user switcher]
  end
  subgraph P1["Phase 1 · Access core"]
    P1a["can() for the whole permission table, restricted Admin view (F-004)"]
    P1b["Audit log writing, no screens (F-005)"]
  end
  subgraph P2["Phase 2 · Case flow"]
    F001[F-001 Create case]
    F002["F-002 Expand, close case"]
    P2a["Assign, reassign, reopen (F-004)"]
  end
  subgraph P3["Phase 3 · Overview and admin"]
    F003[F-003 Case overview]
    P3a["Read access, user admin, deactivated case worker notification (F-004)"]
    P3b["Audit log screens (F-005)"]
  end
  subgraph P4["Phase 4 · Follow-up"]
    F010[F-010 Follow-up case]
    F011[F-011 Follow-up in overview]
  end
  subgraph P5["Phase 5 · Notifications"]
    F012[F-012 Notifications]
  end
  subgraph P6["Phase 6 · Documents & export"]
    F006[F-006 Word documents]
    F007[F-007 Excel export]
    F008[F-008 Create application]
    F009[F-009 Applications in overview]
  end
  P0 --> P1 --> P2 --> P3 --> P4 --> P5 --> P6

  classDef approved fill:#d4edda,stroke:#2e7d32,color:#000
  classDef draft fill:#eeeeee,stroke:#888,stroke-dasharray:4 3,color:#000
  classDef inprogress fill:#d6e6f5,stroke:#1f5f99,color:#000
  classDef done fill:#2e7d32,stroke:#1b5e20,color:#fff
  class P3a,P3b approved
  class P1a,P1b,P2a,F003 inprogress
  class F001,F002 done
  class F006,F007,F008,F009,F010,F011,F012 draft
```

| Feature | Status | Criteria | Phases | Project plan scope |
|---|---|---|---|---|
| F-001 Create case | Done | Written | 2 | v1 |
| F-002 Expand case | Done | Written | 2 | v1 |
| F-003 Case overview | In progress | Written | 3 | v1 |
| F-004 Access control | In progress | Written | 1, 2, 3 | v1 |
| F-005 Audit log | In progress | Written | 1, 3 | v1 |
| F-010 Follow-up case | Draft | Partly written | 4 | v1 |
| F-011 Follow-up in overview | Draft | Missing | 4 | v1 |
| F-012 Notifications | Draft | Partly written | 5 | v1 |
| F-006 Word documents | Draft | Missing | 6 | Later |
| F-007 Excel export | Draft | Needs list of non-sensitive fields | 6 | Later |
| F-008 Create application | Draft | Missing | 6 | Later |
| F-009 Applications in overview | Draft | Missing | 6 | Later |

## How a task moves
```mermaid
flowchart LR
  A["Tine: 'start T2.1'"] --> B[Claude: branch, code, tests, docs]
  B --> C[Claude: lint, typecheck, tests, definition of done]
  C --> D[Claude: open PR]
  D --> E{Tine reviews}
  E -- changes --> B
  E -- approve --> F[Tine merges]
  F --> G[Next task]
```

## Decisions (2026-10-17)
- F-010, F-011 and F-012 stay in v1. Their criteria are refined as we go and approved before their phase starts.
- F-008 and F-009 stay in Phase 6 and are defined later.
- Milestones are dropped; only the build phases are used.
