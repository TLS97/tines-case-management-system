# Documentation

Docs are written while building, in the same PR as the code, so they never lag behind.
Diagrams use Mermaid (renders in Obsidian and GitHub). Keep docs short: diagrams first, a few lines of text.

| Doc | Contents | Update when |
|---|---|---|
| `docs/features/F-xxx-<name>.md` | What it does, user flow, screens, components, permissions | In the PR that builds or changes the feature (copy `docs/features/_template.md`) |
| `docs/roadmap.md` | Features, phases and statuses at a glance | A feature's status changes, or a phase is added or changed |
| `docs/architecture.md` | Layers, routes/pages, main folders | A route, layer or top-level folder is added or changed |
| `docs/domain-model.md` | Entities and relations | A type in `features/*/types.ts` changes |
| `docs/case-lifecycle.md` | Case statuses and follow-up loop | Statuses, transitions or follow-up rules change |
| `docs/decisions/NNNN-<title>.md` | One technical decision each | A library, pattern or structure is chosen or changed |
| `docs/onboarding.md` | How to run the app, reading order | A command, setup step or new doc is added |

## Rules
- Diagrams describe what the code does now, not plans. Mark anything not built yet with *(planned)*.
- Use names from SPEC.md and the code (`SupervisionCase`, `CaseStatus`), so docs and code can be searched together.
- Component diagrams show only feature components and the Designsystemet components they use, not every `div`.
- If SPEC.md and the docs disagree with the code, fix the docs in the same PR or flag it in the PR description.
