---
name: work-orchestrator
description: Deterministically coordinate arbitrary repository work items through design, review, implementation, fix loops, human gates, and completion.
---

# Work Orchestrator

## Identity

Prefer:
- `work_item_id`
- `work_item_type`

Backward compatibility: when `work_item_id` is absent, `lesson_id` may serve as the work-item identifier and implies `work_item_type: lesson`.

## Required references

Workflow state must identify:
- authoritative design/specification path;
- current phase/status/gate;
- current slice;
- latest review;
- blocking findings;
- next transition.

Optional `context` entries may reference durable supporting artifacts.

## Canonical routing

Top-level `phase` is canonical.

Supported phases:
- `design`
- `design_review`
- `human_gate`
- `implementation`
- `implementation_review`
- `fixes`
- `fix_rereview`
- `complete`

## Preflight

Validate:
1. identifier;
2. design/spec path;
3. phase;
4. next-phase compatibility;
5. gate compatibility;
6. current-slice compatibility;
7. blocking-findings compatibility;
8. required artifacts exist;
9. latest review is compatible with state;
10. a claimed next slice actually exists in the approved design;
11. completion gate is used only for a final slice.

If inconsistent, stop with:

`WORKFLOW STATE INCONSISTENT`

Do not infer or silently repair.

## Routing

- `design` → `work-design`
- `design_review` → `design-review`
- `implementation` → `implementation-slice`
- `implementation_review` → `implementation-review`
- `fixes` → `targeted-fix`
- `fix_rereview` → `targeted-rereview`
- `human_gate` → stop unless explicit approval supplied
- `complete` → stop

## Human gates

### design_approval

On approval, transition to the first approved implementation slice.

### next_slice_approval

On approval:
- prove a later approved slice exists;
- archive the previous approved slice in `completed_slices`;
- set the next slice as current;
- transition to `implementation`.

### work_item_completion

On approval:
- prove current slice is final;
- ensure final slice is in `completed_slices`;
- keep it visible in `current_slice`;
- transition to canonical terminal state.

### lesson_completion

Backward-compatible alias of `work_item_completion`.

## Approved-slice decision

After `APPROVED` implementation review or fix re-review:

- later approved slice exists → `human_gate / next_slice_approval`
- no later slice → `human_gate / work_item_completion`

Never invent a slice.

## Terminal state

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

## Reporting

Report:
- preflight result;
- work-item id/type;
- phase executed;
- agent/skill;
- artifacts touched;
- validation;
- resulting phase/gate;
- next allowed action.
