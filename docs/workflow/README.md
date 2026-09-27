# Work-Item Workflow v3

The repository-local orchestration layer is a deterministic state machine for lessons, features, refactors, infrastructure, and maintenance. New work items use v3. Completed v1/v2 workflows remain valid and untouched.

## One mutable control plane

For an active v3 work item, `docs/workflow/<work-item>.yaml` is the only mutable authority for current `phase`, `status`, `gate`, active `blocking_findings`, and `next.action`.

Designs own durable decisions, risks, acceptance criteria, and approved slices. Reviews are immutable dated assessments. Operator plans own bounded operations and evidence. These artifacts must not declare the current route.

V3 removes competing mutable fields: `design.status`, `current_slice.status`, `latest_review.verdict`, `next.phase`, `next.human_approval_required`, and routing/status `notes`.

## Minimal state

```yaml
version: 3
work_item_id: example
work_item_type: maintenance
title: "Example"

phase: design
status: ready
gate: none

design:
  path: docs/technical-designs/example.md
context: []
completed_slices: []
current_slice:
  id: design
  name: "Work item design"
latest_review:
  path: null
blocking_findings: []
next:
  action: create-or-revise-design
```

`ready` permits the recorded action. `blocked` permits only a named non-mutating `supply-<blocker>` action. `awaiting_approval` is valid only at `human_gate`. `complete` is terminal. `gate` is `none` outside `human_gate`.

## State machine

| Phase | Legal action family | Normal successful destination |
| --- | --- | --- |
| `design` | `create-or-revise-design` | `design_review` |
| `design_review` | `review-design` | design approval, reconciliation, or `design` |
| `implementation` | `implement-<slice>` | `implementation_review` or a pinned risky-action gate |
| `implementation_review` | `review-<slice>` | slice/completion gate, fixes, reconciliation, or `design` |
| `fixes` | `fix-<finding-ids>` | `fix_rereview` |
| `fix_rereview` | `rereview-<slice>` | slice/completion gate, fixes, or reconciliation |
| `reconciliation` | `reconcile-<id>` | exact `next.on_success` destination |
| `human_gate` | `approve-<gate>` | exact `next.on_approval` destination |
| `complete` | `none` | terminal |

Prospective destination payloads are permitted only at `reconciliation` and `human_gate`; they do not compete with the current top-level phase.

## Findings and routes

Each active finding records a stable ID, semantic class, immutable source, and summary:

```yaml
blocking_findings:
  - id: MEDIUM-01
    class: documentation_defect
    source: docs/reviews/example/implementation-review-02-slice.md
    summary: "Mutable plan contradicts the accepted execution record."
```

| Class | Route |
| --- | --- |
| `design_defect` | design and renewed review/approval when meaning changes |
| `implementation_defect` | targeted fixes and immutable re-review |
| `documentation_defect` | reconciliation only with an exact repair contract; otherwise design review |
| `state_sync_defect` | reconciliation or separately requested state repair; otherwise fail closed |

Classification follows semantic effect, not extension. If any behavioral finding is active, it takes precedence and all findings stay in the full fix/re-review path.

## Reconciliation

Reconciliation repairs already-decided documentation or state without a redundant review:

```yaml
phase: reconciliation
status: ready
gate: none
reconciliation:
  id: RECON-01
  kind: documentation_defect
  basis:
    path: docs/reviews/example/implementation-review-02-slice.md
    finding_ids: [MEDIUM-01]
  allowed_paths:
    - docs/operations/example-plan.md
    - docs/workflow/example.yaml
  acceptance:
    - "Replace the stale target with the reviewed target; do not change scope."
next:
  action: reconcile-MEDIUM-01
  on_success:
    phase: human_gate
    gate: next_slice_approval
    action: approve-next-slice
```

The repair may touch only allowed paths, close only named findings, and change no behavior, architecture, approved risk, scope, target identity, provider state, credential, database, verdict, or immutable artifact. Success installs the exact recorded destination atomically and may record a compact `last_reconciliation`.

Obvious nonsemantic typo, formatting, broken-link, or evidence-wording maintenance outside an active finding may be direct. Any active-routing meaning requires reconciliation. Any ambiguity returns to review.

## Human gates

- `design_approval`
- `next_slice_approval`
- `work_item_completion` (legacy `lesson_completion` remains readable)
- `production_mutation_approval`
- `destructive_action_approval`
- `credential_change_approval`

Approval is scoped, single-use, and non-transitive. Operational gates pin provider, environment, targets, exact plan/operation, and rollback/stop conditions; destructive and credential gates add their specific recovery/count or owner/scope/lifecycle requirements. Any material scope change invalidates approval.

## Fail closed and state repair

Ordinary inconsistent execution stops with exactly `WORKFLOW STATE INCONSISTENT`, lists conflicts and expected values, and makes no application/provider mutation. It never silently repairs state while executing another phase.

A separately requested `repair-state` operation is permitted only when existing immutable evidence or an unambiguous repository fact fixes the outcome; only workflow state and explicitly named nonsemantic mutable wording may change. It cannot change behavior, architecture, risk, scope, target identity, verdict, provider state, credentials, databases, or historical evidence.

## Migration and compatibility

- Validators select rules by declared version.
- Completed v1/v2 workflows and immutable artifacts are never bulk migrated.
- At an active legacy work item's next explicit action, first validate its current version. A consistent state may migrate atomically before the behavioral phase.
- A repairable stale state uses the bounded state-repair rules.
- Ambiguous outcome, risk, target, slice, or approval fails closed.
- New workflows use v3; `lesson_id`, `spec`, and `lesson_completion` remain legacy-readable.

## Terminal state

```yaml
phase: complete
status: complete
gate: none
blocking_findings: []
next:
  action: none
```

The final approved slice stays in `current_slice` and appears in `completed_slices`.
