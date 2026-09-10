---
name: implementation-review
description: Review one implemented slice, create an immutable review artifact, and transition deterministically to fixes or a human gate.
---

# Implementation Review

Review only; do not modify application code.

Read `AGENTS.md`, workflow state, approved spec, relevant course map/reviews, current diff, and modified files.

Use stable finding IDs and verdict exactly:
- `APPROVED`
- `APPROVED WITH MINOR FIXES`
- `CHANGES REQUIRED`

Create a new immutable review under `docs/reviews/<lesson-id>/`.

## CHANGES REQUIRED transition

```yaml
phase: fixes
status: changes_required
gate: none

latest_review:
  path: <new review path>
  verdict: CHANGES REQUIRED

blocking_findings:
  - <exact blocking IDs>

current_slice:
  status: needs_fixes

next:
  phase: fixes
  action: fix-<slice-id>
  human_approval_required: false
```

## APPROVED transition

```yaml
phase: human_gate
status: approved
gate: next_slice_approval

latest_review:
  path: <new review path>
  verdict: APPROVED

blocking_findings: []

current_slice:
  status: approved

next:
  phase: implementation
  action: begin-next-approved-slice
  human_approval_required: true
```

For minor-fix verdicts, route by explicit blocking classification.

Run actual project validation and record only commands actually executed.
