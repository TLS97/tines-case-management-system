# 0008 Component styles with CSS Modules
**Date:** 2026-10-17  **Status:** accepted

## Context
The app shell needs some layout styling (header, navigation, page spacing) on top of Designsystemet components.
Colors and fonts must come from the theme (CLAUDE.md).

## Decision
- Component styles live in a CSS Module next to the component: `AppLayout.tsx` + `AppLayout.module.css`.
- Only Designsystemet variables for colors, spacing, borders and fonts (`var(--ds-color-…)`, `var(--ds-size-…)` and so on).
  No hex colors or font names.
- The only global stylesheet is `src/app/global.css` (page font and body margin).
- Prefer Designsystemet components and their props (`data-color`, `data-size`, `variant`) before writing CSS.

## Alternatives
Inline styles (no media queries or pseudo-classes); Tailwind or CSS-in-JS (extra dependencies and a second styling system next to Designsystemet).

## Consequences
Built into Vite, so no new dependency. Class names are scoped to the component, so styles cannot leak between features.
