# Code style

## TypeScript
- `strict: true`. No `any`; use `unknown` and narrow.
- Domain types live in `src/features/<feature>/types.ts` and mirror SPEC.md names.
- Use union string types for enums: `type CaseStatus = 'Unassigned' | 'Assigned' | 'InProgress' | 'Closed'`

## React
- Function components only, one component per file, named export.
- Components do presentation; data fetching lives in hooks (`useCase(id)`).
- Props typed with an interface named `<Component>Props`.
- Import other features only through their `index.ts` (`@/features/auth`, never `@/features/auth/permissions`).
  ESLint (`no-restricted-imports`) enforces this.

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
