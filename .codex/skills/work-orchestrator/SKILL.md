---
name: work-orchestrator
description: Deterministically coordinate arbitrary repository work items through design, review, implementation, fix loops, human gates, and completion.
---

# Work Orchestrator

Before validating or dispatching anything, read
[references/contract.md](references/contract.md). It holds the orchestration
invariants that `AGENTS.md` no longer carries in every call.

## Version selection and identity

Validate a workflow under its declared version. Generate only v3.1. Never migrate a completed v1/v2/v3 workflow merely for schema consistency.

Prefer `work_item_id` and `work_item_type`. For legacy state only, `lesson_id` implies `work_item_type: lesson`.

At the next explicitly requested action for a consistent active v1/v2 workflow, migrate it atomically before the behavioral phase: set `version: 3`, remove duplicate mutable fields, classify active findings, and preserve design, review, context, and slice references. If the outcome, target, risk, slice, or approval is ambiguous, fail closed. Migration creates no authority.

## V3 / v3.1 authority and preflight

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

V3.1 also permits `work_item_init` and `delivery_verification`. Fresh
initialization and resume/execution are disjoint entry paths. A fresh
`initialize-work-item` request starts from clean, synchronized `main`, requires
the deterministic branch and every same-ID lifecycle registration or tombstone
to be absent, generates a fresh lifecycle generation, creates the bootstrap
commit, and atomically publishes the canonical branch plus its annotated
lifecycle tag. It does not require an existing branch, generation, or anchor.

Before dispatching any already-initialized v3.1 item, fetch and resolve only
`refs/remotes/origin/work/<work-item-id>` plus the reserved lifecycle tags for
that ID. Require exactly one annotated registration, resolve its bootstrap
commit independently of workflow YAML, and verify repository, requested ID,
deterministic branch, lifecycle generation, bootstrap anchor, current workflow
claims, head/merge metadata, and ancestry. A missing canonical ref or
registration, duplicate registration, conflicting identity, stale `main`
snapshot, inherited copy, or terminal retained branch is non-executable and
must fail closed. A failed resume never enters initialization and never
substitutes the current checkout, `main`, another ref, or history.

If inconsistent, stop with exactly `WORKFLOW STATE INCONSISTENT`, list conflicts and expected values, and make no application/provider mutation. Do not infer or silently repair. A state-only `repair-state` action is allowed only when separately requested and all bounded conditions in `references/contract.md` (Fail closed) are proven.

## Routing

- `design` / `create-or-revise-design` → `work-design`
- `work_item_init` / `initialize-work-item` → perform the ordered safe-init contract
- `design_review` / `review-design` → `design-review`
- `implementation` / `implement-<slice>` → `implementation-slice`
- `implementation_review` / `review-<slice>` → `implementation-review`
- `fixes` / `fix-<finding-ids>` → `targeted-fix`
- `fix_rereview` / `rereview-<slice>` → `targeted-rereview`
- `reconciliation` / `reconcile-<id>` → `reconciliation`
- `delivery_verification` / `verify-delivery` or `retry-delivery-<id>` → `delivery-verification`
- `human_gate` / `approve-<gate>` → stop unless matching explicit approval is supplied
- `complete` / `none` → stop

A `blocked` state permits only its named non-mutating `supply-<blocker>` action.

## Invocation boundary

Each invocation executes at most one phase. Every model call resends the whole
thread, so a fresh session per phase costs less than continuing in a thread
that has already grown.

When an invocation begins by supplying approval for the current human gate,
consume exactly that gate, commit and publish the resulting transition, report
the newly authorized action, and stop before dispatching it.

After a successful non-human phase, commit and publish its complete
transition, re-resolve the authoritative workflow using the applicable identity
rules, and run the full preflight against that fresh state. Then report the
next allowed action with its launcher prompt, and stop. The next phase starts
in a fresh session. Phase skills remain responsible only for their own phase
and complete state transition.

Continue in the same invocation only when the user explicitly requests
continuation for this invocation, for example "continue until the next gate".
At a human gate this requires both that exact approval and the explicit
continuation request. Generic approval or a generic request to proceed is not
a continuation request. Before each continued dispatch, re-resolve the
published state and run the full preflight. Compare the fresh routing
fingerprint (lifecycle identity, `phase`, `status`, `gate`, and `next.action`)
with the fingerprint that produced the preceding successful dispatch. An
unchanged fingerprint or an invalid or ambiguous transition is unsafe
continuation: stop and use the existing fail-closed reporting instead of
retrying blindly.

Even with explicit continuation, stop at an explicit human gate, a risky
external mutation requiring its typed approval, blocked input that cannot be
supplied safely, inconsistent or ambiguous state, unsafe or failed execution,
or exact terminal completion. Approval supplied for an earlier gate is never
reused for a newly reached gate.

## Context and command output

Read only the current work item's workflow, its authoritative design, the
latest review, and the paths in `context` or the current slice. Do not read
other work items' workflows, reviews, designs, or evidence unless the current
design or `context` names them. Use `docs/workflow/templates/` for formats.
`docs/workflow/README.md` and the root `README.md` are human summaries of this
contract; do not load them during a phase.

Keep model-visible evidence proportional to the routing decision. Prefer exact
paths and IDs, provider-side field selection, bounded result/time/log windows,
and projections that emit only required scalars. Filter structured output in
the same command that retrieves it; do not first expose a broad JSON response or
complete logs and summarize afterward. Never print secret or variable
collections. If narrow evidence is insufficient, retrieve only the missing
fact and fail closed if it cannot be established.

## Gates

Approval is scoped, non-transitive, and single-use. Consume only the currently recorded gate and pinned scope.

- `design_approval`: enter the first approved slice.
- `next_slice_approval`: prove a later slice, archive the approved current slice, and enter exactly that slice.
- `work_item_completion` / legacy `lesson_completion`: prove the current slice is final, record it in `completed_slices`, retain it as current, and enter terminal state.
- `production_mutation_approval`: require provider, environment, target IDs, exact operation/plan, and rollback/stop conditions.
- `destructive_action_approval`: additionally require pinned targets, recovery evidence, and allowed destroy count.
- `credential_change_approval`: require owner, scope, destination, expiry/rotation, and secret-safe verification.
- `merge_approval`: require the canonical branch and lifecycle generation,
  primary PR targeting `main`, exact reviewed implementation SHA, clean tree,
  no findings, approved diff, and read-only branch-retention proof. Resolve and
  present the current full PR head and its successful required checks without
  persisting either value. Prove the head descends from `reviewed_sha` and each
  intervening commit changes only approved same-item control-plane artifacts.
  The presenting phase ends with a launcher prompt that names that full head
  SHA. Because the head is never persisted, a fresh session consumes merge
  approval only if the approval names the full head SHA and it equals the
  freshly resolved head; otherwise present the head and stop without merging.
  After approval, re-resolve all scope and fail closed if the head changed;
  merge atomically with that unchanged expected head, record the exact
  resulting `main` SHA, and enter delivery verification on the retained work
  branch. Any post-review implementation/application change requires review.

Changed target IDs, plan contents, destroy counts, credential scope, or risk invalidate approval. Design approval never substitutes for an operational gate.

## Review outcomes

After `APPROVED`, route to `next_slice_approval` when a later approved slice
exists. For a final v3 slice route to `work_item_completion`; for a final v3.1
slice route to `merge_approval`. After `APPROVED WITH RECONCILIATION`, route
only through the exact recorded reconciliation. Any active design or
implementation defect takes precedence over reconciliation. Never invent a
slice.

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
