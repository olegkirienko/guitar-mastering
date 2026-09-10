---
name: lesson-orchestrator
description: Coordinate the lesson engineering workflow deterministically by validating workflow state, routing from canonical phase, and stopping at human gates.
---

# Lesson Orchestrator

## Canonical routing

Top-level `phase` is canonical.

`next.phase` must match `phase` after a completed transition, except when `phase: human_gate`; then `next.phase` names the post-approval phase.

Do not choose a phase from `next.phase`, `current_slice.status`, review verdicts, filenames, or user wording when they conflict with `phase`.

## Preflight validation

Before executing any phase, verify:

1. `phase` is supported;
2. `next.phase` is compatible with `phase`;
3. `gate` is compatible with `phase`;
4. `current_slice.status` is compatible with `phase`;
5. `blocking_findings` is compatible with review/fix state;
6. referenced required artifacts exist;
7. `latest_review.verdict`, when it drives state, is compatible with `phase/status`.

If inconsistent:

- stop immediately;
- report exactly `WORKFLOW STATE INCONSISTENT`;
- list conflicting fields and expected values;
- do not modify application code;
- do not execute the requested phase;
- do not silently repair state unless explicitly asked for a state-only repair.

## Routing

- `design` → `lesson-design`
- `design_review` → `design-review`
- `implementation` → `implementation-slice`
- `implementation_review` → `implementation-review`
- `fixes` → `targeted-fix`
- `fix_rereview` → `targeted-rereview`
- `human_gate` → stop
- `complete` → stop

## Outcome routing

Design review:
- APPROVED → human gate / design approval
- CHANGES REQUIRED → design

Implementation review:
- APPROVED → human gate / next-slice approval
- CHANGES REQUIRED → fixes with exact blocking IDs

Fix re-review:
- APPROVED → human gate / next-slice approval
- CHANGES REQUIRED → fixes with remaining blocking IDs

For `APPROVED WITH MINOR FIXES`, follow explicit blocking/non-blocking classification.

## Complete-transition rule

A phase is not complete until both its work and workflow-state transition are complete.

Update all relevant fields together:
`phase`, `status`, `gate`, `current_slice.status`, `latest_review`,
`blocking_findings`, `next.phase`, `next.action`, `next.human_approval_required`.

## Human gates

Do not cross:
- reviewed design → implementation;
- approved implementation slice → next slice.

## Completion report

Report:
- preflight validation result;
- phase executed;
- agent/skill used;
- artifacts created/modified;
- validation;
- resulting canonical `phase`;
- gate/status;
- next allowed action.
