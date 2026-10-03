---
name: untitled-ui
description: Build or change UI with Untitled UI React components. Use before adding or editing any component, page layout, form control, button, icon, or theme token in this repo.
---

# Untitled UI

The project uses Untitled UI React (free, MIT): React Aria Components, Tailwind
CSS 4.3, copy-in source files. Do not hand-roll a component Untitled UI has.
Existing hand-written lesson components stay until their lesson migrates.

## Find and add

1. **Find first.** Use the `untitledui` MCP tools: `search_components`,
   `list_components`, `get_component`, `get_component_bundle`,
   `search_icons`. They return metadata and an install command, not files.
   `get_page_template_files` (PRO page templates) always asks for approval and
   is not needed without a PRO license.
2. **Add with the pinned CLI** (it writes into `src/`):
   `corepack pnpm dlx untitledui@0.1.69 add <name> -y`
   Several names are fine (`add button toggle`). Review the diff before
   committing. `login`, PRO components, and `example` are out of scope
   (no PRO license).
3. **Icons** come from `@untitledui/icons` as named imports, passed as
   components: `<Button iconLeading={ChevronDown} />`.

## Where things live

- `components.json` holds the aliases (`@/components/`, `@/utils/`,
  `@/hooks/`, `@/styles/`); keep them valid `tsconfig` paths.
- `src/components/{base,application,foundations}` are CLI-owned and appear as
  components are added (only `base` exists so far): edit generated files only
  to adapt styling or fix a defect.
- `src/utils/cx.ts` (`cx`, `sortCx`), `src/hooks/`, `src/providers/route-provider.tsx`,
  `src/styles/{theme,globals}.css`.

## Rules for Untitled UI code

- Import React Aria with the `Aria` prefix:
  `import { Button as AriaButton } from "react-aria-components"`.
- All files and folders are kebab-case; each `.tsx` lives in a folder of the
  same name (see CLAUDE.md, Code structure). In the Untitled UI folders the
  CLI creates `date-picker.tsx` files; keep them as generated.
- Use semantic color tokens, never raw palette classes: `text-primary`,
  `text-secondary`, `bg-primary`, `bg-brand-solid`, `border-secondary`,
  `text-error-primary`. Find a token with `rg -n "<name>" src/styles/theme.css`
  instead of reading the whole file. Brand colors change only in `theme.css`.
- Style variants with `sortCx({ common, sizes, colors })` and merge with `cx`.
- Disabled state is `disabled:opacity-50`, not per-token disabled colors.
- Small transitions use `transition duration-100 ease-linear`.
- Props follow the library: `size`, `color`, `isDisabled`, `isLoading`,
  `isInvalid`, `iconLeading`, `iconTrailing`.
- `globals.css` keeps two overrides (`--text-xs--line-height`,
  `--text-xl--line-height`) for the unmigrated pages; remove them when the
  pages move to Untitled UI components.

## Verify

`corepack pnpm build` (includes lint), `corepack pnpm test`, and
`corepack pnpm test:browser` when a page changes.
