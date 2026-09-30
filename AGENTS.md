# Guitar Mastering

## Project goal

Interactive course for learning classical six-string guitar from first principles.

## Tech stack

React 19, TypeScript, Vite, Tailwind CSS 4, pnpm, React Router, Railway
Node/Express, PostgreSQL, Untitled UI ecosystem.

## Source of truth

The pedagogical course design is stored in `docs/course-map/`. Before
implementing a lesson, read the corresponding stage document.

## Pedagogical principles

Do not introduce terminology before the learner has encountered the phenomenon
or problem that motivates it.

Lesson flow: experience → question → prediction → experiment → observation →
pattern → concept/name → guitar application → checkpoint → bridge / next
question.

Every lesson combines understanding, listening, physical interaction with the
guitar, and experimentation. Avoid long passive theory blocks.

## Development rules

- Use TypeScript, Tailwind CSS, and `@/*` imports for `src`.
- Prefer reusable lesson primitives over page-specific duplication.
- Keep educational content separate from generic UI components.
- Do not add dependencies unless necessary.
- Use the Node version from `.nvmrc`; call `corepack pnpm` directly.
- After meaningful changes run `corepack pnpm test`, `corepack pnpm build`
  (it already runs lint), and `git diff --check`. Add
  `corepack pnpm validate:workflow` when `docs/workflow/` or `.codex/` changes.

## Context budget

Every model call resends the whole thread, so keep it small:

- Read only what the task needs: the files you change, their direct
  dependencies, and the current work item's workflow, design, and latest review.
- Do not read other work items' workflows, designs, reviews, operations plans,
  or evidence unless the current design or `context` names them. Use
  `docs/workflow/templates/` for formats, not historical workflows.
  `.rgignore` hides that history from default `rg`; pass a path explicitly when
  it is named.
- Locate before reading: `rg -n` with at most `-C 3`, then `sed -n` for the exact
  range. Do not dump whole long documents or several files at once.
- Git: start with `git status --short` and `git diff --stat`, then diff single
  paths. Never use large `--unified` contexts or log/show without limits.
- Commands must print only what the decision needs: filter JSON at the source,
  bound logs by lines and time, and show only failing test output.
- Never print secrets, tokens, or variable collections.

## Work tracks

Choose the track before starting.

**Lite track** (small, low-risk changes): copy, styling, `src` UI code, course
docs, or a contained bug fix of at most about 300 changed lines, lockfiles
excluded. Work on a `fix/<topic>` or `chore/<topic>` branch in one session:
implement, validate, self-review the diff, and open one PR. CI and the human PR
review are the gate. No workflow YAML, design document, or review artifact is
created.

The lite track never covers auth, persistence, migrations, deployment,
production, credentials, provider state, or runtime dependencies. It also never
touches `AGENTS.md`, `.codex/`, `.github/`, `.railway/`, `scripts/`, `server/`,
`docs/workflow/`, `docs/reviews/`, `docs/delivery-evidence/`, or
`docs/operations/`. If unsure, or if the change grows past the limit or into an
excluded area, stop and switch to the orchestrated track.

**Orchestrated track** (`work-orchestrator` skill): lessons, everything the
lite track excludes, multi-slice features, or whenever the user asks. Before
any orchestrated action, read
`.codex/skills/work-orchestrator/references/contract.md`; it holds the v3/v3.1
invariants, gates, and fail-closed rules. Each invocation executes one phase
and stops unless the user explicitly asks to continue; the next phase runs in a
fresh session.
