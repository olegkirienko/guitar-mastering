# Orchestration Auto-Advance

**Work item:** `orchestration-auto-advance` (`maintenance`)

## Goal

Make one `work-orchestrator` invocation continue through every successive
deterministic non-human phase until the workflow reaches a real stop condition.
After each successful phase, the orchestrator must re-read and validate the
authoritative workflow state before dispatching the next allowed action.

## Non-goals

- Do not change the v3.1 state model, phase vocabulary, routing table, finding
  classification, lifecycle identity, Git/GitHub delivery contract, or review
  artifact rules.
- Do not remove, combine, pre-authorize, or otherwise weaken a human gate.
- Do not make a phase skill responsible for dispatching a later phase.
- Do not add a general-purpose workflow engine, background worker, dependency,
  persistence layer, retry scheduler, or parallel phase execution.
- Do not broaden any phase's authority to mutate application or provider state.

## Preserved invariants

1. The canonical v3.1 workflow YAML remains the only mutable routing authority.
2. Fresh initialization and resume remain disjoint, and each dispatch retains
   the existing repository, branch, lifecycle registration, bootstrap-anchor,
   ancestry, and terminal-branch checks.
3. Every phase validates state before acting and owns its complete transition.
4. Review artifacts remain immutable, finding IDs and classifications remain
   stable, and fixes/reconciliation remain limited to their recorded scope.
5. Human approvals stay scoped, non-transitive, single-use, and mandatory at
   every existing design, slice, merge, completion, production, destructive,
   and credential gate.
6. Risky external mutations still require their typed explicit approval.

## Design

Add one concise auto-advance loop to
`.codex/skills/work-orchestrator/SKILL.md`. The loop belongs to the orchestrator,
not to individual phase skills:

1. Run the currently validated `next.action` with the existing routing table.
2. After a successful non-human phase, resolve the authoritative workflow
   again using the existing v3.1 canonical-branch and lifecycle rules.
3. Run the full preflight against that fresh state.
4. If the state is another ready deterministic non-human phase, dispatch its
   recorded action immediately in the same invocation.
5. Repeat until a stop condition applies.

The loop applies to `work_item_init`, `design`, `design_review`,
`implementation`, `implementation_review`, `fixes`, `fix_rereview`,
`reconciliation`, and `delivery_verification`, including repeated review/fix
cycles. It changes orchestration continuity only; each routed skill keeps its
current responsibilities and mutation boundary.

The fresh state must advance to a different valid routing fingerprint after a
successful dispatch. The fingerprint is the authoritative lifecycle identity
plus `phase`, `status`, `gate`, and `next.action`. An unchanged fingerprint or
an invalid/ambiguous transition is not retried blindly; it is an unsafe
continuation and stops execution with the existing fail-closed reporting.

## Stop conditions

Stop the invocation only when one of these conditions is observed after the
fresh-state validation:

- `phase: human_gate` with an explicit approval required;
- workflow state is inconsistent or ambiguous;
- a risky external mutation requires explicit approval;
- `status: blocked` identifies missing input that cannot be supplied safely;
- phase execution failed or the next action cannot be executed safely;
- the exact terminal `complete` state is reached.

A successful phase transition by itself is never a stop condition. The
orchestrator must not consume an approval inferred from the original request or
from an earlier gate.

## Validation strategy

Extend the existing workflow-contract validator with focused assertions that
the orchestrator instructions retain:

- the post-success re-read and full validation requirement;
- automatic same-invocation dispatch for ready non-human phases;
- the explicit stop boundaries and unchanged-state guard;
- the prohibition on treating ordinary phase completion as a stop.

Run the repository workflow validation, lint, tests, build, and
`git diff --check`. No application runtime, database, provider, or deployment
behavior changes in this work item.

## Implementation slice

### `auto-advance-orchestrator`

Update only:

- `.codex/skills/work-orchestrator/SKILL.md` with the orchestration loop and
  stop conditions;
- `scripts/validate-workflow-contract.mjs` with focused contract assertions;
- this work item's workflow and immutable review artifacts as required by the
  v3.1 lifecycle.

Acceptance criteria:

1. One invocation automatically follows every successive validated, ready,
   non-human action without asking the user to prompt again.
2. State is freshly resolved and fully validated after every successful phase
   before another phase is dispatched.
3. All existing human gates, mutation approvals, phase boundaries, and
   fail-closed checks remain mandatory.
4. The invocation stops for a human gate, inconsistent/ambiguous state, blocked
   input, unsafe execution, repeated routing fingerprint, phase failure, or
   terminal completion.
5. Existing workflow validation and the new focused assertions pass alongside
   lint, tests, build, and whitespace validation.

## Risk and rollback

The primary risk is wording that encourages the orchestrator to carry stale
state or accidentally treat a previous approval as permission for a later
gate. The mandatory fresh-state preflight and explicit stop list constrain that
risk. A second risk is an infinite loop when a phase reports success without a
state transition; the routing-fingerprint guard makes that fail closed.

Rollback is a normal revert of the skill and validator changes. Existing
workflow files and completed histories remain valid because the state model is
unchanged.
