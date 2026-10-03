# Untitled UI React setup

## Goal and non-goals

**Goal.** Give the repo the documented Untitled UI React foundation, so new UI
is built from Untitled UI components through its CLI and MCP server instead of
by hand, and agents get the library's conventions on demand.

**Non-goals.** Migrating the 21 existing hand-written components (buttons,
slider, radio groups, forms, progress bar); PRO components, `login`, and OAuth;
dark mode and a ThemeProvider; `upgrade`/`migrate`. Migration follows in
separate PRs together with the lessons.

## Current state

- `@untitledui/icons` is used in 12 files. `react-aria-components` is declared
  but never imported. `tailwind-merge` is used through `src/lib/cx.ts`, which
  has no `sortCx` or extended merge config (3 importers).
- No `components.json`, no Untitled UI theme tokens (`text-primary`,
  `bg-secondary`, `fg-*`), no providers, no MCP/CLI, no agent guidance.
- `src/styles/globals.css` has one `@theme` block with our terracotta
  `brand-25…900` scale and only `success-600`, while the code uses
  `success-50/200/300/700`, which emit no CSS today.
- Router is `react-router-dom` 7. `@/*` already maps to `src/*` in
  `tsconfig.app.json` and `vite.config.ts`. Tailwind is 4.3 with `@tailwindcss/vite`.

Sources: untitledui.com/react `docs/{installation,cli,introduction}`,
`integrations/{vite,mcp,claude,components-json}`, and `AGENT.md`.

## Design

`untitledui init` creates a new project, so it is not run in the repo. It is run
once in a scratch directory (`corepack pnpm dlx untitledui@latest init <dir>
--vite -y`) and the generated files are copied in, instead of hand-writing the
token file.

**Slice 1: foundation**
- Add `tailwindcss-react-aria-components` and `tailwindcss-animate`; keep
  `@untitledui/icons`, `react-aria-components`, `tailwind-merge`. These are the
  library's documented dependencies, an exception to "no new dependencies".
- `components.json`: `aliases` `components:"@/components/"`,
  `utils:"@/utils/"`, `hooks:"@/hooks/"`, `styles:"@/styles/"`; `version:"8"`.
  The CLI reads only these keys.
- Structure: `src/components/{base,application,foundations}` (CLI-owned,
  kebab-case), `src/utils/{cx.ts,is-react-component.ts}`,
  `src/hooks/{use-breakpoint.ts,use-clipboard.ts}`,
  `src/providers/route-provider.tsx`. `src/lib/cx.ts` is replaced by
  `src/utils/cx.ts` and its 3 importers are updated. Existing PascalCase lesson
  components keep their names.
- Styles: `src/styles/theme.css` from the scaffold with our terracotta scale in
  `--color-brand-*`, and `globals.css` in the documented shape
  (`@import "tailwindcss"`, `@import "./theme.css"`, the two `@plugin` lines,
  custom variants, font). Our `@theme` block is removed. This also defines the
  missing `success-*` shades.
- `main.tsx`: wrap the app in `RouteProvider` (`react-router-dom`
  `useNavigate`/`useHref`). No ThemeProvider.
- Smoke: `corepack pnpm dlx untitledui@latest add button -y`; keep the result
  as the base for migrations.

**Slice 2: agent tooling**
- `.mcp.json` (project scope): `untitledui`, http,
  `https://www.untitledui.com/react/api/mcp`. Free components need no auth, and
  no key is stored. Allow the read-only tools in `.claude/settings.json`:
  `search_components`, `list_components`, `get_component`,
  `get_component_bundle`, `get_page_templates`, `search_icons`. The PRO
  `get_page_templates_files` is not allowed and keeps prompting.
- `.claude/skills/untitled-ui/SKILL.md` (on-demand), condensed from the
  upstream `AGENT.md`: `Aria*` import prefix; kebab-case names for Untitled UI
  code; semantic color tokens only; `sortCx`/`cx`; `opacity-50` for disabled;
  `transition duration-100 ease-linear`; base/application/foundations
  placement; icons as component references; find via MCP, add via
  `corepack pnpm dlx untitledui@latest add <name> -y`. Upstream suggests the
  whole `AGENT.md` (about 6,000 words) as `CLAUDE.md`, which would resend about
  8K tokens every turn; the skill avoids that.
- `CLAUDE.md`: about 5 lines under "Development rules" (build UI from Untitled
  UI via the skill; do not hand-roll components it has; edit generated files
  only for theming; dependency exception).
- `README.md`: a short "UI components" section.

## Security and privacy

The MCP server and CLI are third-party network services. Only free components
are used, no credentials or API keys are configured or committed, and `-y`
(non-interactive) is used for agents only on `add`. Generated code is reviewed
in the diff like any other code. Project-scope MCP servers ask each user for
approval once.

## Rollback

Revert the PR. No data or deployment configuration changes.

## Test strategy

- `corepack pnpm test`, `corepack pnpm build` (includes lint),
  `git diff --check`, `corepack pnpm test:browser`.
- Before/after screenshots of Home, Lesson 1, Lesson 2, and Account, because
  global tokens change; grays and `success-*` may shift slightly.
- In a fresh session, `/mcp` shows `untitledui` connected and
  `search_components "button"` returns results.
- `add button` leaves `components.json` unchanged and the build green.

## Slices

1. **Foundation** — scope as above; accepted when build, tests, and the visual
   check pass and `button` installs through the CLI.
2. **Agent tooling** — scope as above; accepted when MCP connects in a fresh
   session and the skill, `CLAUDE.md` lines, and README are in place.

Both slices land in one PR.
