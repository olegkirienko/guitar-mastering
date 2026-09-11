---
name: lesson-orchestrator
description: Deterministically coordinate lesson workflow, including final lesson completion.
---

# Lesson Orchestrator

Top-level `phase` is canonical.

Before execution validate:
1. supported phase;
2. `next.phase` compatibility;
3. gate compatibility;
4. current slice status compatibility;
5. blocking findings compatibility;
6. required artifacts exist;
7. latest review verdict compatibility;
8. `begin-next-approved-slice` is used only when a later slice actually exists;
9. `lesson_completion` is used only when current slice is final.

If inconsistent:
- stop with `WORKFLOW STATE INCONSISTENT`;
- list conflicts and expected values;
- do not modify application code;
- do not infer or silently repair.

## Routing

- `design` → `lesson-design`
- `design_review` → `design-review`
- `implementation` → `implementation-slice`
- `implementation_review` → `implementation-review`
- `fixes` → `targeted-fix`
- `fix_rereview` → `targeted-rereview`
- `human_gate` → stop unless explicit approval is supplied
- `complete` → stop and report lesson completion

## Human gates

### `design_approval`
On explicit approval, transition to first approved implementation slice.

### `next_slice_approval`
On explicit approval:
- verify a later approved slice exists;
- add previous approved slice to `completed_slices` if needed;
- set next slice as `current_slice`;
- transition fully to `phase: implementation`.

Never invent the next slice.

### `lesson_completion`
On explicit approval:
- verify current slice is final;
- ensure it is recorded in `completed_slices`;
- keep it in `current_slice` for auditability;
- transition fully to:

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

Do not start another lesson.

## Approved slice decision

Whenever implementation review or targeted re-review returns `APPROVED`, inspect the approved lesson specification.

- Later slice exists → `human_gate / next_slice_approval`
- No later slice → `human_gate / lesson_completion`

## Complete transition rule

Update all relevant fields together:
`phase`, `status`, `gate`, `current_slice`, `completed_slices`,
`latest_review`, `blocking_findings`, `next.phase`, `next.action`,
`next.human_approval_required`.
