# Lesson Engineering Workflow

The workflow is finite and deterministic.

## Supported gates

- `none`
- `design_approval`
- `next_slice_approval`
- `lesson_completion`

## Terminal transition

Before using `next_slice_approval`, inspect the approved lesson specification.

If a later implementation slice exists:

`approved review → human_gate / next_slice_approval`

If not:

`approved review → human_gate / lesson_completion`

After explicit approval of lesson completion:

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

The final approved slice must be recorded in `completed_slices` and remain visible in `current_slice` for auditability.

`complete` applies to the current lesson only.

## Transition table

| Completed phase/gate | Outcome | New phase | Gate |
|---|---|---|---|
| `design` | ready | `design_review` | `none` |
| `design_review` | approved | `human_gate` | `design_approval` |
| `design_review` | changes required | `design` | `none` |
| `design_approval` | approved | `implementation` | `none` |
| `implementation` | success | `implementation_review` | `none` |
| `implementation_review` | changes required | `fixes` | `none` |
| `implementation_review` | approved + later slice | `human_gate` | `next_slice_approval` |
| `implementation_review` | approved + final slice | `human_gate` | `lesson_completion` |
| `fixes` | success | `fix_rereview` | `none` |
| `fix_rereview` | changes required | `fixes` | `none` |
| `fix_rereview` | approved + later slice | `human_gate` | `next_slice_approval` |
| `fix_rereview` | approved + final slice | `human_gate` | `lesson_completion` |
| `next_slice_approval` | approved | `implementation` | `none` |
| `lesson_completion` | approved | `complete` | `none` |

Never invent a new slice from numbering conventions.
