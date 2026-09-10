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

## Local development

```bash
pnpm install
pnpm dev
```

Build:

```bash
pnpm build
```

Preview production build:

```bash
pnpm preview
```

## GitHub Pages

Проєкт використовує `HashRouter`, тому він коректно працює як статичний сайт на GitHub Pages без server-side routing.

Vite налаштований з `base: './'`, тому збірка використовує відносні asset paths.

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

# Codex Orchestration Layer v1

Repo-local workflow for repeatable lesson development:

`design/planning → plan review → implementation → implementation review → fixes → fix re-review`

The repository is the durable source of truth. Chat history is not required for handoff between phases.

## Principles

1. `AGENTS.md` contains project-wide invariants.
2. `.codex/agents/` defines phase-specific custom agent profiles.
3. `.codex/skills/` defines reusable phase workflows and artifact contracts.
4. `docs/course-map/` is curriculum truth.
5. `docs/lesson-designs/` is lesson design/specification truth.
6. `docs/reviews/` contains immutable review artifacts.
7. `docs/workflow/` records the current workflow state and gate status.
8. Review agents do not modify application code.
9. Fix agents address finding IDs only.
10. Human approval remains a gate after design review and before starting a new implementation slice.

## v1 workflow

```text
DESIGN
  ↓
DESIGN REVIEW
  ↓
HUMAN GATE
  ↓
IMPLEMENTATION
  ↓
IMPLEMENTATION REVIEW
  ├── APPROVED ──────────────→ HUMAN GATE / NEXT SLICE
  └── CHANGES REQUIRED
           ↓
          FIXES
           ↓
       FIX RE-REVIEW
           ├── APPROVED ─────→ HUMAN GATE / NEXT SLICE
           └── CHANGES REQUIRED ─→ FIXES
```

## Invocation

Start Codex in the repository root and ask it to run the `lesson-orchestrator` skill for the current workflow state.

```text
Use the lesson-orchestrator workflow.
Read docs/workflow/stage-01-lesson-01.yaml and execute the next allowed phase.
Stop at human gates.
```

## Model policy

The repo-local agent profiles declare the intended model and reasoning effort:

- design: Sol / medium
- plan review: Sol / high
- implementation: Terra / medium
- implementation review: Sol / high
- targeted fixes: Terra / low
- fix re-review: Sol / high

Verify the effective child model/effort in your installed Codex runtime before relying on model pinning for cost or quality guarantees.

## Artifact policy

Review artifacts are immutable snapshots. Never edit an old review to mark findings fixed; create a new review artifact.

## v1 scope

v1 does not automate Git commits, PR creation, issue tracking, releases, or arbitrary parallel fan-out. It automates repeated instructions and handoffs while retaining explicit human gates.

# Codex Orchestration v1.1 Patch
Fixes the routing inconsistency discovered during the first live implementation/review cycle.

## Core rule

Top-level `phase` is the canonical routing field.

`next.phase` is not a second source of truth. After a completed transition it must match `phase`, except at a human gate, where it names the phase that becomes legal only after explicit approval.

Before executing a phase, the orchestrator must validate workflow-state consistency. If fields conflict, it must fail closed with:

`WORKFLOW STATE INCONSISTENT`

and must not modify application code or infer the intended phase.

Each successful phase owns a complete state transition.

## Apply

Replace the included skill files and `docs/workflow/README.md`.

Merge `AGENTS.v1.1-snippet.md` into the existing root `AGENTS.md`.

The current Step 04 state after implementation review is already expected to be:

- phase: `fixes`
- status: `changes_required`
- blocking findings: `HIGH-01`, `HIGH-02`, `MEDIUM-07`, `MEDIUM-08`
- next action: `fix-step-04`
