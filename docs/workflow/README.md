# Lesson Engineering Workflow

The workflow state is a deterministic control-plane contract.

## Canonical field

Top-level `phase` is the canonical phase allowed to execute now.

Normally `next.phase == phase` after a completed transition.

Exception: when `phase: human_gate`, `next.phase` names the post-approval phase.

Never infer routing from contradictory fields.

## Fail closed

Before executing any phase, validate workflow state.

If inconsistent, stop with:

`WORKFLOW STATE INCONSISTENT`

Do not modify application code and do not silently repair ambiguity.

## Transition table

| Completed phase | Outcome | New canonical phase | Gate |
|---|---|---|---|
| `design` | ready | `design_review` | `none` |
| `design_review` | approved | `human_gate` | `design_approval` |
| `design_review` | changes required | `design` | `none` |
| `implementation` | success | `implementation_review` | `none` |
| `implementation_review` | changes required | `fixes` | `none` |
| `implementation_review` | approved | `human_gate` | `next_slice_approval` |
| `fixes` | success | `fix_rereview` | `none` |
| `fix_rereview` | changes required | `fixes` | `none` |
| `fix_rereview` | approved | `human_gate` | `next_slice_approval` |

## Complete-transition rule

A phase is not complete until both its work and workflow-state transition are complete.

Update relevant fields together:

- `phase`
- `status`
- `gate`
- `current_slice.status`
- `latest_review`
- `blocking_findings`
- `next.phase`
- `next.action`
- `next.human_approval_required`

Never leave `phase` pointing at a phase that already completed.

## Examples

Ready for implementation review:

```yaml
phase: implementation_review
status: ready
gate: none
current_slice:
  status: implemented
next:
  phase: implementation_review
  action: review-step-04
  human_approval_required: false
```

Changes required:

```yaml
phase: fixes
status: changes_required
gate: none
blocking_findings:
  - HIGH-01
next:
  phase: fixes
  action: fix-step-04
  human_approval_required: false
```

Ready for fix re-review:

```yaml
phase: fix_rereview
status: ready
gate: none
current_slice:
  status: fixed
next:
  phase: fix_rereview
  action: rereview-step-04
  human_approval_required: false
```

Human gate:

```yaml
phase: human_gate
status: approved
gate: next_slice_approval
blocking_findings: []
next:
  phase: implementation
  action: begin-next-approved-slice
  human_approval_required: true
```
