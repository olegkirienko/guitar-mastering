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
- Railway Node/Express
- PostgreSQL
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
→ prediction
→ experiment
→ observation
→ pattern
→ concept/name
→ guitar application
→ checkpoint
→ bridge / next question

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
- Run `pnpm lint` and `pnpm build` after meaningful changes; run `git diff --check` for implementation/fix workflow phases.

## Engineering workflow

Use the repository-local Codex orchestration layer for structured work.

The orchestration unit is a **work item**. A work item may represent a lesson, technical feature, refactor, infrastructure change, maintenance task, or another explicitly scoped change.

### Sources of truth

- `AGENTS.md` — project-wide rules and orchestration invariants.
- `.codex/agents/` — role-specific agent profiles and model/reasoning policy.
- `.codex/skills/` — reusable phase workflows.
- `docs/course-map/` — curriculum/stage source of truth.
- `docs/lesson-designs/` — approved lesson designs/specifications.
- `docs/technical-designs/` — technical architecture/design artifacts.
- `docs/reviews/` — immutable review artifacts and quality gates.
- `docs/workflow/` — deterministic workflow state.

Each workflow state must explicitly reference its authoritative design/specification artifact.

### Generic workflow

`design → design review → human gate → implementation → implementation review → targeted fixes / reconciliation → human gate → next slice or complete`

Do not skip a blocking review gate.

### Work-item identity

New workflows should use:

```yaml
work_item_id: <id>
work_item_type: <type>
```

Recommended types:

- `lesson`
- `technical_feature`
- `refactor`
- `infrastructure`
- `maintenance`

Historical lesson workflows using `lesson_id` remain valid. Do not rewrite completed historical workflows merely to migrate field names.

### Review artifacts

Completed review files are immutable snapshots. Never rewrite a previous review to mark findings fixed.

Every actionable finding must receive a stable identifier such as `CRITICAL-01`, `HIGH-01`, `MEDIUM-01`, or `LOW-01`.

Every v3 finding must also be classified as one of:

- `design_defect`
- `implementation_defect`
- `documentation_defect`
- `state_sync_defect`

Classification follows semantic effect, not file type. Ambiguous documentation or state findings fail closed into design or implementation review.

Fix tasks must reference active finding IDs and remain limited to those findings.

### Scope discipline

- Design/review agents must not modify application code.
- Implementation agents must implement only the approved slice.
- Fix agents must not expand scope beyond selected finding IDs.
- Re-review agents must not reopen resolved findings unless the latest changes introduced a direct regression.
- Reconciliation agents may make only the exact non-behavioral repair authorized by workflow state.
- Avoid speculative abstractions and unrelated refactors.
- Do not implement future slices merely because doing so would make the current change easier.

### Human gates

Human approval is required:

1. after design review and before implementation begins;
2. after an implementation slice is approved and before the next slice begins;
3. after the final implementation slice is approved and before the work item transitions to `complete`.

Supported gates:

- `design_approval`
- `next_slice_approval`
- `merge_approval`
- `work_item_completion`
- `production_mutation_approval`
- `destructive_action_approval`
- `credential_change_approval`
- legacy `lesson_completion`

For new workflows prefer `work_item_completion`.

### Validation

Before declaring implementation or fixes ready for review, run the repository's existing validation commands, including build, lint/typecheck, tests when present, and `git diff --check` when applicable.

Use the Node version specified by the project environment / `.nvmrc`.

## Workflow-state consistency

`docs/workflow/*.yaml` is a deterministic control-plane contract.

### V3 / v3.1 source of truth

For active v3 work items, the workflow YAML is the only mutable authority for:

- `phase`
- `status`
- `gate`
- active `blocking_findings`
- `next.action`

Designs own durable decisions and approved slices. Reviews are immutable historical assessments. Operator plans own bounded operations and evidence. None of those artifacts may claim the current route.

V3 deliberately omits duplicate mutable fields: `design.status`, `current_slice.status`, `latest_review.verdict`, `next.phase`, `next.human_approval_required`, and routing/status `notes`.

Top-level `phase` selects the legal transition family. `next.action` is the only action allowed now. Prospective destinations are legal only as `next.on_approval` at `human_gate` and `next.on_success` at `reconciliation`.

The status vocabulary is:

- `ready` for an executable active phase;
- `blocked` for a named missing input, with a non-mutating `supply-<blocker>` action;
- `awaiting_approval` for `human_gate` only;
- `complete` for `complete` only.

`gate` must be `none` outside `human_gate`.

Never infer routing from contradictory workflow fields.

V3.1 adds the Git/GitHub delivery lifecycle. For a Git-managed v3.1 work item,
`work/<work-item-id>` is the sole executable control-plane branch from
initialization through pushed terminal completion. Resolve the workflow from
`refs/remotes/origin/work/<work-item-id>` and its unique annotated lifecycle
registration, then bind repository, work-item ID, branch, lifecycle generation,
bootstrap anchor, and ancestry before dispatch. Never fall back to `main`, the
current checkout, another ref, or a stale workflow snapshot.

Fresh initialization is a separate path from resume: it starts from clean,
synchronized `main`, requires the branch and every authoritative same-ID claim
to be absent, generates a fresh lifecycle identity, and creates the bootstrap
commit and annotated registration. It does not require an existing branch or
generation. Resume requires both the remote branch and exactly one matching
registration; absence or mismatch fails closed and cannot fall back to
initialization. A retained terminal work branch is immutable, non-executable
history. A non-terminal work branch must not be deleted; deletion becomes
eligible only after the exact terminal state is committed and visible on the
remote canonical branch.

### Fail closed

Before executing a workflow phase or consuming a gate, validate state.

If inconsistent:

1. stop;
2. report exactly `WORKFLOW STATE INCONSISTENT`;
3. list conflicting fields;
4. state expected consistent values;
5. do not modify application code;
6. do not silently repair state as part of another phase.

A state-only repair may be performed only when explicitly requested and an immutable review, explicit approval, approved design, or unambiguous repository fact already determines the outcome. It must change no behavior, architecture, accepted risk, slice scope, target identity, review verdict, provider state, credentials, database, or historical evidence. Record the bounded repair as `last_reconciliation`; otherwise fail closed.

### Complete transitions

The agent completing a successful phase owns the complete transition to the next phase.

Update all relevant fields together, including when applicable:

- `phase`
- `status`
- `gate`
- `current_slice`
- `completed_slices`
- `latest_review.path`
- `blocking_findings`
- `next.action`
- `next.on_approval` or `next.on_success`

Never leave `phase` pointing at a phase that has already completed.

### V3.1 delivery transitions

The normal v3.1 route is:

`work_item_init → design → design_review → design_approval → implementation ↔ review/fixes → merge_approval → delivery_verification → work_item_completion → complete`

Use one early Draft PR for the work item. Do not routinely push directly to
`main`. The final approved slice routes to a scoped `merge_approval`, not to
completion. Merge approval pins the canonical branch, lifecycle generation,
PR, `main` target, and exact reviewed implementation SHA. The current PR head
and successful validation run are resolved dynamically and presented to the
human; they are not persisted before merge. The head must descend from the
reviewed SHA, and every intervening commit must contain only approved
control-plane artifacts. Re-resolve after approval and merge atomically only
when the exact presented head is unchanged; any later implementation or
application change requires review again.

After protected merge, record the exact resulting full `main` SHA as delivery
truth. `delivery_verification` must correlate that SHA across GitHub push CI,
Railway deployment metadata, the pre-deploy verifier, migration,
startup/readiness, and production smoke. Only successful immutable delivery
evidence may route to `work_item_completion`.

Provider outages, flaky CI, and exact documentation/state mismatches use the
smallest retry or reconciliation route that preserves scope. Evidence of an
actual design or implementation defect returns to its full reviewed loop.

### Final-slice rule

Before `next_slice_approval`, prove that another approved implementation slice exists in the authoritative design/specification.

If another slice exists, use `next_slice_approval`.

If the current slice is final under v3, use `work_item_completion`.

If the current slice is final under v3.1, use `merge_approval`; successful
delivery verification is the only route from that merge to
`work_item_completion`.

Existing historical lesson workflows may use `lesson_completion`.

Never invent a slice that is not present in the authoritative design.

### Terminal state

After explicit approval of the final completion gate:

```yaml
phase: complete
status: complete
gate: none

blocking_findings: []

next:
  action: none
```

The final approved slice must be recorded in `completed_slices` and remain visible in `current_slice` for auditability.

`complete` means the current work item is complete, not the entire project or course.

### Repo-local Codex skills

Primary v3 / v3.1 skills:

- `work-orchestrator`
- `work-design`
- `design-review`
- `implementation-slice`
- `implementation-review`
- `targeted-fix`
- `targeted-rereview`
- `reconciliation`
- `delivery-verification`

New workflows use v3.1. Active v1/v2/v3 workflows are validated under their
declared version and migrate only through an explicit compatible action.
Completed historical workflows and immutable artifacts remain unchanged and
valid under their original contract.

Compatibility:

- `lesson-orchestrator` — wrapper for historical lesson workflows
