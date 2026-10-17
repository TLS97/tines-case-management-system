# Case lifecycle

## Supervision case
```mermaid
stateDiagram-v2
  [*] --> Unassigned : leader creates case (F-001)
  Unassigned --> Assigned : leader assigns case worker (F-004)
  Assigned --> Assigned : leader reassigns
  Assigned --> InProgress : assigned case worker's first change (F-002)
  InProgress --> InProgress : leader reassigns
  InProgress --> Closed : case worker closes, every party has a reaction (F-002)
  Closed --> InProgress : leader reopens (F-004)
```
- A `Closed` case cannot be changed by anyone until a leader reopens it.
- Rules and who can do what: [SPEC.md, Case status](../SPEC.md#case-status).
- All transitions are built: created as Unassigned (T2.1), assign and reassign (T2.3), InProgress on the first change
  (T2.4), close and reopen (T2.7). Every status change is logged as "status changed" (F-005).

## Follow-up (F-010) *(planned, Draft)*
```mermaid
flowchart TD
  R[Reaction: Restriction of practice] --> F[Follow-up case created with first due date]
  F --> W[Wait until due date]
  W --> C[Contact health personnel or their leader]
  C --> Q{Practised within conditions?}
  Q --> Rec[Register result and findings]
  Rec --> N[Set new due date]
  N --> W
```
