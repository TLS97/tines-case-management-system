# F-xxx <Feature name>

**Status:** Draft | Approved | In progress | Done (same as SPEC.md)
**Spec:** [SPEC.md](../../SPEC.md#f-xxx)

## What it does
One or two sentences from the user's point of view.

## Who can use it
| Role | Can |
|---|---|
| CaseWorker | |
| Leader | |
| Admin | |

## User flow
```mermaid
flowchart TD
  A[Start] --> B[Step]
  B --> C{Decision}
  C -- yes --> D[Result]
  C -- no --> E[Other result]
```

## Screens and components
```mermaid
flowchart TD
  Page[SomePage] --> Comp[FeatureComponent]
  Comp --> DS1[ds: Textfield]
  Comp --> DS2[ds: Button]
```

## Data
Which types, hooks and mock API endpoints it uses.
