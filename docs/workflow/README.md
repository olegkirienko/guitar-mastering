# Work-Item Workflow v3.1

The repository-local orchestration layer is a deterministic state machine for lessons, features, refactors, infrastructure, and maintenance. New work items use v3.1. Completed v1/v2/v3 workflows remain valid and untouched.

This page is a human summary. Agents load the binding contract from
`.codex/skills/work-orchestrator/references/contract.md` and the
`work-orchestrator` skill. Each invocation executes one phase, publishes its
transition, and stops; the next phase starts in a fresh session unless the user
explicitly asks to continue. Small, low-risk changes use the lite track in
`AGENTS.md` and create no workflow state.

## One mutable control plane

For an active work item, `docs/workflow/<work-item>.yaml` on its resolved
canonical ref is the only mutable authority for current `phase`, `status`,
`gate`, active `blocking_findings`, and `next.action`.

Designs own durable decisions, risks, acceptance criteria, and approved slices. Reviews are immutable dated assessments. Operator plans own bounded operations and evidence. These artifacts must not declare the current route.

V3 and v3.1 omit competing mutable fields: `design.status`, `current_slice.status`, `latest_review.verdict`, `next.phase`, `next.human_approval_required`, and routing/status `notes`.

## Minimal v3.1 state

```yaml
version: 3.1
work_item_id: example
work_item_type: maintenance
title: "Example"

phase: work_item_init
status: ready
gate: none

git:
  repository: github.com/owner/repository
  branch: work/example
  lifecycle_generation: <uuid>
  lifecycle_anchor_sha: null
  pr_number: null
  reviewed_sha: null
  merged_sha: null

delivery:
  evidence_path: null

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
  action: initialize-work-item
```

`ready` permits the recorded action. `blocked` permits only a named non-mutating `supply-<blocker>` action. `awaiting_approval` is valid only at `human_gate`. `complete` is terminal. `gate` is `none` outside `human_gate`.

## State machine

| Phase | Legal action family | Normal successful destination |
| --- | --- | --- |
| `work_item_init` | `initialize-work-item` | `design` |
| `design` | `create-or-revise-design` | `design_review` |
| `design_review` | `review-design` | design approval, reconciliation, or `design` |
| `implementation` | `implement-<slice>` | `implementation_review` or a pinned risky-action gate |
| `implementation_review` | `review-<slice>` | slice/merge gate, fixes, reconciliation, or `design` |
| `fixes` | `fix-<finding-ids>` | `fix_rereview` |
| `fix_rereview` | `rereview-<slice>` | slice/completion gate, fixes, or reconciliation |
| `reconciliation` | `reconcile-<id>` | exact `next.on_success` destination |
| `human_gate` | `approve-<gate>` | exact `next.on_approval` destination |
| `delivery_verification` | `verify-delivery` or `retry-delivery-<id>` | completion gate, fixes, or reconciliation |
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
- `merge_approval`
- `production_mutation_approval`
- `destructive_action_approval`
- `credential_change_approval`

Approval is scoped, single-use, and non-transitive. Operational gates pin provider, environment, targets, exact plan/operation, and rollback/stop conditions; destructive and credential gates add their specific recovery/count or owner/scope/lifecycle requirements. Any material scope change invalidates approval.

## Canonical Git identity and lifecycle

Fresh initialization and resume/execution are separate entry paths. A fresh
request begins from clean, fetched, synchronized, non-divergent `main` and
requires no existing branch, lifecycle generation, or registration. It rejects
any local or remote canonical branch and any same-ID workflow/ref/PR history,
registration, tombstone, or other authoritative claim. It then generates a
fresh UUID, creates the initial identity in a bootstrap commit, records that
commit's full SHA as `lifecycle_anchor_sha`, and atomically publishes the branch
and annotated `refs/tags/orchestration/<work-item-id>/<generation>` tag. It
never inherits executable state or a lifecycle UUID from `main`.

Resume fetches and reads only
`refs/remotes/origin/work/<work-item-id>` after independently requiring exactly
one matching annotated lifecycle registration. Its tag target is the bootstrap
anchor and its annotation and bootstrap workflow bind repository, ID, branch,
and generation. Workflow Git fields are claims until they match that binding
and the bootstrap commit is proven in canonical-branch ancestry. A missing
branch or registration, moved anchor, mismatch, or duplicate registration never
falls back to initialization, `main`, the current checkout, another ref, a tag,
or history. Workflow snapshots on `main` and inherited copies are inert. A
terminal retained branch is an immutable tombstone and is rejected before
checkout or dispatch.

The canonical branch cannot be deleted while non-terminal. Before merge,
read-only evidence must prove the chosen merge path retains it. The exact
terminal workflow must be committed and visible on the remote branch before a
separately approved destructive cleanup may delete it.

## PR, merge, and delivery

The first meaningful checkpoint opens the one Draft PR targeting `main`; the
same PR carries routine design, implementation, and fix checkpoints. Routine
direct pushes to `main` and control-plane finalization PRs are forbidden.

The final approved v3.1 slice records the exact implementation
`reviewed_sha` and routes to `merge_approval`. Stable gate scope pins the
branch, lifecycle generation, PR, `main` target, and reviewed SHA. The current
full PR head and its successful required validation run are resolved and
presented dynamically, never persisted before merge. That head must descend
from `reviewed_sha`; every intervening commit must contain only the same work
item's workflow transition and new immutable implementation/fix re-review.
After approval the head is re-resolved, and any change or post-review
implementation/application edit invalidates approval and requires review.
Protected merge must atomically bind to the unchanged presented head.

Protected merge records the exact resulting full `main` SHA. The retained work
branch then enters `delivery_verification`, which correlates that SHA across
the primary PR, push-event GitHub CI, Railway deployment metadata and
`WAITING`, the pre-deploy verifier, migration, startup/readiness, and production
smoke. Only positive immutable evidence may enter `work_item_completion`.
Transient CI/provider failures remain retryable without inventing findings;
actual defects return to design or fixes; exact non-behavioral mismatches use
reconciliation; production mutations retain their typed gate.

## Fail closed and state repair

Ordinary inconsistent execution stops with exactly `WORKFLOW STATE INCONSISTENT`, lists conflicts and expected values, and makes no application/provider mutation. It never silently repairs state while executing another phase.

A separately requested `repair-state` operation is permitted only when existing immutable evidence or an unambiguous repository fact fixes the outcome; only workflow state and explicitly named nonsemantic mutable wording may change. It cannot change behavior, architecture, risk, scope, target identity, verdict, provider state, credentials, databases, or historical evidence.

## Migration and compatibility

- Validators select rules by declared version.
- Completed v1/v2/v3 workflows and immutable artifacts are never bulk migrated.
- Active pre-activation v3 work items remain v3 unless a separately designed,
  explicitly requested migration can prove compatible provenance. This v3
  installer remains v3 through terminal completion and requires no fabricated
  branch, generation, anchor, tag, or PR.
- A repairable stale state uses the bounded state-repair rules.
- Ambiguous outcome, risk, target, slice, or approval fails closed.
- Eligible work items created after the v3.1 contract is installed on canonical
  `main` use v3.1; `lesson_id`, `spec`, and `lesson_completion` remain
  legacy-readable.

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
