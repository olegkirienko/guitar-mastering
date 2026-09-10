# Guitar Mastering

## Project goal

Interactive course for learning classical six-string guitar from first principles.

## Tech stack

- React 19
- TypeScript
- Vite
- Tailwind CSS 4
- pnpm
- React Router
- GitHub Pages
- Untitled UI ecosystem

## Source of truth

The pedagogical course design is stored in:

docs/course-map/

Before implementing a lesson, read the corresponding stage document.

## Pedagogical principles

Do not introduce terminology before the learner has encountered
the phenomenon or problem that motivates it.

Lesson flow should generally follow:

experience
→ question
→ observation
→ pattern
→ concept/name
→ guitar experiment
→ application
→ next question

Every lesson should combine:

- understanding
- listening
- physical interaction with the guitar
- experimentation

Avoid long passive theory blocks.

## Development rules

- Use TypeScript.
- Prefer reusable lesson primitives over page-specific duplication.
- Keep educational content separate from generic UI components.
- Use @/* imports for src.
- Use Tailwind CSS.
- Do not add dependencies unless necessary.
- Run pnpm build after meaningful changes.

## Engineering workflow

Use the repository-local Codex orchestration layer for lesson work.

### Sources of truth

- `docs/course-map/` — curriculum and stage-level source of truth.
- `docs/lesson-designs/` — approved lesson design/specification source of truth.
- `docs/reviews/` — immutable review artifacts and quality gates.
- `docs/workflow/` — current workflow state.
- `.codex/skills/` — reusable phase workflows.
- `.codex/agents/` — role-specific Codex agent profiles.

### Workflow

`design/planning → plan review → human gate → implementation → implementation review → targeted fixes → targeted re-review → human gate → next slice`

Do not skip a blocking review gate.

### Review artifacts

Completed review files are immutable snapshots. Never rewrite a previous review to mark findings fixed. Create a new review artifact for each re-review.

Every actionable review finding must receive a stable identifier such as `CRITICAL-01`, `HIGH-01`, `MEDIUM-01`, or `LOW-01`.

Fix tasks must reference finding IDs and remain limited to those findings.

### Scope discipline

- Design/review agents must not modify application code.
- Implementation agents must implement only the approved slice.
- Fix agents must not expand scope beyond selected finding IDs.
- Re-review agents must not reopen resolved findings unless the latest changes introduced a regression.
- Avoid speculative abstractions and unrelated refactors.
- Do not implement a future lesson step merely because it would make current code easier.

### Human gates

Human approval is required:
1. after a design/plan is reviewed and before implementation begins;
2. after an implementation slice is approved and before the next slice begins.

The orchestrator must stop at these gates.

### Validation

Before declaring implementation or fixes ready for review, run the project's existing validation commands, including build, lint/typecheck, and `git diff --check` when available.

Use the Node version specified by the project environment / `.nvmrc`.

### Repo-local Codex skills

- `lesson-orchestrator`
- `lesson-design`
- `design-review`
- `implementation-slice`
- `implementation-review`
- `targeted-fix`
- `targeted-rereview`

## Workflow-state consistency

`docs/workflow/*.yaml` is a deterministic control-plane contract.

### Canonical routing

- Top-level `phase` is the canonical source of truth for the phase that may execute now.
- `next.phase` must match `phase` after a completed transition.
- Exception: when `phase: human_gate`, `next.phase` names the phase that becomes legal only after explicit human approval.
- `next.action` describes the concrete action inside that phase.

Never infer routing from contradictory workflow fields.

### Fail closed

Before executing a workflow phase, validate state.

If inconsistent:

1. stop;
2. report exactly `WORKFLOW STATE INCONSISTENT`;
3. list conflicting fields;
4. state the expected consistent values;
5. do not modify application code;
6. do not silently repair the state as part of another phase.

A state-only repair may be performed only when explicitly requested.

### Complete transitions

The agent completing a successful phase owns the transition to the next phase.

Update all relevant fields together:

- `phase`
- `status`
- `gate`
- `current_slice.status` when applicable
- `latest_review` when applicable
- `blocking_findings`
- `next.phase`
- `next.action`
- `next.human_approval_required`

Never leave `phase` pointing at a phase that has already completed.