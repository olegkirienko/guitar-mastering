---
name: work-orchestrator
description: Deterministically coordinate arbitrary repository work items through design, review, implementation, fix loops, human gates, and completion.
---

# Work Orchestrator

## Version selection and identity

Validate a workflow under its declared version. Generate only v3. Never migrate a completed v1/v2 workflow merely for schema consistency.

Prefer `work_item_id` and `work_item_type`. For legacy state only, `lesson_id` implies `work_item_type: lesson`.

At the next explicitly requested action for a consistent active v1/v2 workflow, migrate it atomically before the behavioral phase: set `version: 3`, remove duplicate mutable fields, classify active findings, and preserve design, review, context, and slice references. If the outcome, target, risk, slice, or approval is ambiguous, fail closed. Migration creates no authority.

## V3 authority and preflight

Workflow YAML is the only mutable authority for phase, status, gate, active findings, and next action. Designs own durable decisions and slices; reviews are immutable evidence; operator documents own operations and observations.

Validate before every action or gate consumption:

1. schema version and identity;
2. design/specification and context paths;
3. exact `phase/status/gate/next.action` compatibility;
4. current/completed slice membership in the design;
5. latest-review path and phase compatibility;
6. unique active finding IDs, class, source, and route;
7. reconciliation basis, allowed paths, acceptance, and destination;
8. typed gate scope and destination;
9. later-slice proof for `next_slice_approval`;
10. final-slice proof and no active findings for completion;
11. exact terminal state.

V3 phases are `design`, `design_review`, `implementation`, `implementation_review`, `fixes`, `fix_rereview`, `reconciliation`, `human_gate`, and `complete`.

If inconsistent, stop with exactly `WORKFLOW STATE INCONSISTENT`, list conflicts and expected values, and make no application/provider mutation. Do not infer or silently repair. A state-only `repair-state` action is allowed only when separately requested and all bounded conditions in `AGENTS.md` are proven.

## Routing

- `design` / `create-or-revise-design` → `work-design`
- `design_review` / `review-design` → `design-review`
- `implementation` / `implement-<slice>` → `implementation-slice`
- `implementation_review` / `review-<slice>` → `implementation-review`
- `fixes` / `fix-<finding-ids>` → `targeted-fix`
- `fix_rereview` / `rereview-<slice>` → `targeted-rereview`
- `reconciliation` / `reconcile-<id>` → `reconciliation`
- `human_gate` / `approve-<gate>` → stop unless matching explicit approval is supplied
- `complete` / `none` → stop

A `blocked` state permits only its named non-mutating `supply-<blocker>` action.

## Gates

Approval is scoped, non-transitive, and single-use. Consume only the currently recorded gate and pinned scope.

- `design_approval`: enter the first approved slice.
- `next_slice_approval`: prove a later slice, archive the approved current slice, and enter exactly that slice.
- `work_item_completion` / legacy `lesson_completion`: prove the current slice is final, record it in `completed_slices`, retain it as current, and enter terminal state.
- `production_mutation_approval`: require provider, environment, target IDs, exact operation/plan, and rollback/stop conditions.
- `destructive_action_approval`: additionally require pinned targets, recovery evidence, and allowed destroy count.
- `credential_change_approval`: require owner, scope, destination, expiry/rotation, and secret-safe verification.

Changed target IDs, plan contents, destroy counts, credential scope, or risk invalidate approval. Design approval never substitutes for an operational gate.

## Review outcomes

After `APPROVED`, route to `next_slice_approval` when a later approved slice exists, otherwise `work_item_completion`. After `APPROVED WITH RECONCILIATION`, route only through the exact recorded reconciliation. Any active design or implementation defect takes precedence over reconciliation. Never invent a slice.

## Terminal state

```yaml
phase: complete
status: complete
gate: none
blocking_findings: []
next:
  action: none
```

Report preflight, identity/type, phase and skill, touched artifacts, validation, resulting phase/gate, and next allowed action.
