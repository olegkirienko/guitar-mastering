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

# Codex Orchestration Layer v1.2

The repository contains a deterministic, repo-local workflow for lesson development.

The repository is the durable source of truth; Codex sessions do not need to carry previous chat history forward.

## Workflow

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
  ├── CHANGES REQUIRED
  │        ↓
  │      FIXES
  │        ↓
  │   FIX RE-REVIEW
  │        ├── CHANGES REQUIRED → FIXES
  │        └── APPROVED
  │
  └── APPROVED
           ↓
       HUMAN GATE
           ↓
    NEXT SLICE OR COMPLETE
```

For the final approved slice, the workflow uses a `lesson_completion` human gate and then transitions to `phase: complete`.

## Sources of truth

- `AGENTS.md` — project-wide rules and orchestration invariants
- `.codex/agents/` — role-specific agent profiles and model/reasoning policy
- `.codex/skills/` — reusable phase workflows
- `docs/course-map/` — curriculum/stage truth
- `docs/lesson-designs/` — approved lesson specifications
- `docs/reviews/` — immutable review artifacts
- `docs/workflow/` — current deterministic workflow state

## Invocation

For a normal phase, a minimal launcher prompt is sufficient:

```text
Use the lesson-orchestrator workflow for stage-01-lesson-01.

Read and validate the current workflow state, then execute the next allowed phase.
```

At a human gate, approval must be explicit:

```text
Use the lesson-orchestrator workflow for stage-01-lesson-01.

Approve the current human gate, then read and validate the workflow state and execute the next allowed phase.
```

The orchestrator executes one allowed phase at a time and stops at the next phase or human gate.

## Model policy

Repo-local agent profiles declare the intended model and reasoning effort:

- design/planning — Sol / medium
- design review — Sol / high
- implementation — Terra / medium
- implementation review — Sol / high
- targeted fixes — Terra / low
- targeted re-review — Sol / high

A fresh Codex session per workflow phase is recommended. The top-level orchestrator session can use Sol / medium; the phase-specific profile is the intended source of truth for delegated model/effort.

## Deterministic workflow state

Top-level `phase` in `docs/workflow/*.yaml` is the canonical routing field.

Before executing any phase, the orchestrator validates workflow-state consistency. If the state is contradictory, it fails closed with:

```text
WORKFLOW STATE INCONSISTENT
```

It must not infer the intended phase or modify application code.

Each successful phase owns a complete state transition.

## Review and fix policy

Review artifacts are immutable snapshots. New review/re-review cycles create new files rather than rewriting previous reviews.

Actionable findings receive stable IDs such as:

```text
HIGH-01
MEDIUM-03
```

Targeted fixes operate only on active blocking finding IDs, and targeted re-review verifies those findings plus direct regressions.

## Terminal lesson state

When the final approved implementation slice has no successor in the lesson specification, the workflow transitions through:

```text
human_gate / lesson_completion
→ explicit human approval
→ complete
```

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

`complete` means the current lesson workflow is complete, not the entire course.

## Current orchestration scope

The orchestration layer automates phase routing, artifact handoff, validation contracts, review/fix loops, and deterministic state transitions.

It intentionally does not automate Git commits, pushes, pull requests, releases, or arbitrary parallel agent fan-out.
