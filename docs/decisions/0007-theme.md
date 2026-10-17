# 0007 Theme: tokens, font and default color
**Date:** 2026-10-17  **Status:** accepted

## Context
T0.3 sets up the `htil-theme` from `designsystemet.config.json`. Three problems came up:
- The token generator `@digdir/designsystemet` 1.23.0 depends on `braces` 3.0.3, which has a high-severity
  advisory (GHSA-vfj7-8cjw-p6xm) and no fixed version yet. As a dependency, it makes `npm audit --audit-level=high` fail in CI.
- The theme uses the Inter font, but nothing loads it, so browsers fall back to a serif font.
- By default all components use the `accent` color (#E2F1E9). It is so light that primary buttons barely show on a white page.

## Decision
- **Tokens:** the generator is not a project dependency. `npm run tokens` runs a pinned version through `npx`
  and writes `design-tokens/` (token JSON) and `design-tokens-build/` (theme CSS and types). Both folders are
  generated and committed, so the app and CI never run the generator.
- **Font:** Inter is self-hosted with `@fontsource-variable/inter` (OFL-1.1). The config sets
  `'Inter Variable', system-ui, sans-serif`, and `src/app/global.css` applies `var(--ds-font-family)` to `body`,
  because Designsystemet's CSS does not set the page font itself.
- **Default color:** `<body data-color="htil-hovedfarge">` in `index.html`. Components use the dark green
  unless they set their own `data-color`. The color values in the config are unchanged.

## Alternatives
- Tokens: keep the generator as a dev dependency and audit runtime dependencies only (`--omit=dev`), which would hide future dev-tool problems;
  or keep it and let CI fail until `braces` is fixed.
- Font: Google Fonts (visitors' browsers contact Google, a GDPR concern); system fonts (looks different on each computer).
- Default color: keep `accent`, or use `htil-sekundaerfarge` (teal).

## Consequences
- The generator version in the `tokens` script must be kept equal to `@digdir/designsystemet-react` and `-css`.
  Dependabot does not update it, so bump it by hand when those packages are updated, then run `npm run tokens`.
- Revisit putting the generator back as a dev dependency once `braces` has a fix.
- `npm run tokens` downloads the generator the first time it runs.
