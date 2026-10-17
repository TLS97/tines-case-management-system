# F-001 Create supervision case

**Status:** Approved
**Spec:** [SPEC.md](../../SPEC.md#f-001-create-supervision-case-approved-2026-10-17)

## What it does
A leader creates a new supervision case in one of their fields. Id, case number, status and department are set automatically.

## Who can use it
| Role | Can |
|---|---|
| CaseWorker | – |
| Leader | Create cases in own department and own fields |
| Admin | – |

## User flow
```mermaid
flowchart TD
  A[Overview] --> B{Leader?}
  B -- no --> X[No 'New case' button / API rejects]
  B -- yes --> C[Click 'New case']
  C --> D[Form: field preset to primary field]
  D --> E{Field in leader's fields?}
  E -- no --> F[Not selectable / API rejects]
  E -- yes --> G[Submit]
  G --> H[Mock API sets id, caseNumber yyyy/nnnn, status Unassigned, leader's department]
  H --> I[Case detail page, where the leader can assign it]
```

## Screens and components *(planned)*
```mermaid
flowchart TD
  NewCasePage --> NewCaseForm
  NewCaseForm --> FieldSelect[ds: Select]
  NewCaseForm --> Submit[ds: Button]
```

## Data
`SupervisionCase`, `Field`, `useCreateCase()`, `POST /cases` (mock).
