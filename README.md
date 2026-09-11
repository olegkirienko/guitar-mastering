# 🎸 Гітара з нуля

Інтерактивний курс для вивчення класичної шестиструнної гітари з нуля.

## Stack

- React 19
- TypeScript
- Vite
- Tailwind CSS v4
- Untitled UI React ecosystem / React Aria
- pnpm
- GitHub Pages
- Cloudflare Workers + D1 (preview runtime)

## Local development

```bash
pnpm install
pnpm dev
```

Build:

```bash
pnpm build:pages
```

Worker preview build and local runtime:

```bash
pnpm build:worker
pnpm db:migrate:local
pnpm exec wrangler dev
```

The deployment target fails closed to `pages`: only an explicit
`VITE_DEPLOY_TARGET=worker` enables the root-base Worker build and future account
capabilities. Local API probes are available at `/api/v1/health` and
`/api/v1/readiness`.

Preview production build:

```bash
pnpm preview
```

Repository validation:

```bash
pnpm lint
pnpm test
pnpm build:pages
pnpm build:worker
```

`pnpm test` includes the runtime/schema acceptance suite. It builds both
deployment targets through the real Vite configuration, exercises the client
account-capability gate, and applies the checked-in migrations to fresh,
isolated local D1 state. Run only that boundary with
`pnpm test:runtime-schema`.

## GitHub Pages

Проєкт використовує `HashRouter`, тому він коректно працює як статичний сайт на GitHub Pages без server-side routing.

Pages-збірка використовує `base: '/guitar-mastering/'`. Наявний workflow завжди
передає явний target `pages`, тому майбутні account/profile/sync entry points не
можуть випадково потрапити на origin без API.

## Structure

```text
src/
├── components/   # reusable UI
├── data/         # course data
├── lib/          # utilities
├── pages/        # route-level pages
├── styles/       # global Tailwind/theme
├── App.tsx
└── main.tsx
```

# Codex Orchestration Layer v2.0

The repository uses a deterministic, repo-local workflow for both lesson development and technical work.

The orchestration unit is a **work item**.

Examples:

- `stage-01-lesson-02`
- `feature-auth-persistence`
- `feature-profile`
- `refactor-progress-storage`
- `infra-cloudflare-migration`

Historical `lesson_id` workflows remain supported.

## Workflow

`design → design review → human gate → implementation → implementation review → fixes ↔ fix re-review → human gate → next slice or complete`

## Sources of truth

- `AGENTS.md` — project rules and orchestration invariants
- `.codex/agents/` — role-specific agent profiles
- `.codex/skills/` — reusable workflow phases
- `docs/course-map/` — curriculum/stage truth
- `docs/lesson-designs/` — lesson specifications
- `docs/technical-designs/` — technical architecture/design artifacts
- `docs/reviews/` — immutable review artifacts
- `docs/workflow/` — deterministic work-item state

## Standard launcher

For a normal phase:

```text
Use the work-orchestrator workflow for <work-item-id>.

Read and validate the current workflow state, then execute the next allowed phase.
```

At a human gate:

```text
Use the work-orchestrator workflow for <work-item-id>.

Approve the current human gate, then read and validate the workflow state and execute the next allowed phase.
```

## Model policy

- design/planning — Sol / medium
- design review — Sol / high
- implementation — Terra / medium
- implementation review — Sol / high
- targeted fixes — Terra / low
- targeted re-review — Sol / high

A fresh Codex session per workflow phase is recommended.

## Deterministic state

Top-level `phase` in `docs/workflow/*.yaml` is canonical.

Contradictory state fails closed with:

```text
WORKFLOW STATE INCONSISTENT
```

The orchestrator must not guess the intended phase or silently repair the state.

## Reviews and fixes

Review artifacts are immutable snapshots. Actionable findings use stable IDs such as `HIGH-01` or `MEDIUM-03`.

Targeted fixes operate only on active blocking IDs. Targeted re-review verifies those findings plus direct regressions.

## Completion

Before starting another slice, the orchestrator verifies that the authoritative design actually defines one.

If the approved slice is final:

`human_gate / work_item_completion → explicit human approval → complete`

Existing historical lesson workflows may retain legacy `lesson_completion`.

Canonical terminal state:

```yaml
phase: complete
status: complete
gate: none
blocking_findings: []
next:
  phase: complete
  action: none
  human_approval_required: false
```

`complete` means the current work item is complete only.
