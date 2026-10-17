# Code style

## TypeScript
- `strict: true`. No `any`; use `unknown` and narrow.
- Domain types live in `src/features/<feature>/types.ts` and mirror SPEC.md names. They are Zod schemas,
  and the types are inferred with `z.infer` (decision 0005). UI text for enum values goes in `labels.ts`.
- Use union string types for enums: `type CaseStatus = 'Unassigned' | 'Assigned' | 'InProgress' | 'Closed'`

## React
- Function components only, one component per file, named export.
- Components do presentation; data fetching lives in hooks (`useCase(id)`).
- Props typed with an interface named `<Component>Props`.
- Import other features only through their `index.ts` (`@/features/auth`, never `@/features/auth/permissions`).
  ESLint (`no-restricted-imports`) enforces this.

## Pages and styles
- Every route page renders through `Page` with a `title` (sets the document title and the h1). See decision 0009.
- Styles: CSS Module next to the component, Designsystemet variables only. See decision 0008.
- Text inputs in forms use `TextInput` (`shared/components`): label, description and error are linked by id, and
  `size` sets the width (Designsystemet makes inputs without `size` fill their box).

## UI text
- All UI text is in English. Keep labels short and consistent with SPEC.md terms.

## Naming
| Thing | Convention | Example |
|---|---|---|
| Component | PascalCase | `CaseOverviewTable.tsx` |
| Hook | camelCase, `use` prefix | `useCaseFilters.ts` |
| Type | PascalCase | `SupervisionCase` |
| Constant | UPPER_SNAKE | `MAX_DEPARTMENT_ID` |

## Clean code
- Functions do one thing; prefer early returns over nested ifs.
- No magic strings for roles or statuses; import the type/constant.
- Comments explain *why*, not *what*.

## Example
```tsx
import { Button } from '@digdir/designsystemet-react';
import { can, type User } from '@/features/auth';
import type { SupervisionCase } from '@/features/cases';

interface AssignCaseButtonProps {
  supervisionCase: SupervisionCase;
  user: User;
  onAssign: () => void;
}

export function AssignCaseButton({ supervisionCase, user, onAssign }: AssignCaseButtonProps) {
  if (!can(user, 'assignCase', supervisionCase)) return null;
  return <Button onClick={onAssign}>Assign case</Button>;
}
```
