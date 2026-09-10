---
name: targeted-rereview
description: Re-review active fixes, create an immutable review artifact, and transition deterministically to fixes or a human gate.
---

# Targeted Re-Review

Verify only active blocking finding IDs plus direct regressions caused by their fixes.

Do not conduct a new full review.

Per finding choose exactly:
- `FIXED`
- `PARTIALLY FIXED`
- `NOT FIXED`
- `REGRESSED`

Verdict exactly:
- `APPROVED`
- `APPROVED WITH MINOR FIXES`
- `CHANGES REQUIRED`

Create a new immutable review artifact.

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

## CHANGES REQUIRED transition

Keep only unresolved blocking IDs:

```yaml
phase: fixes
status: changes_required
gate: none

latest_review:
  path: <new review path>
  verdict: CHANGES REQUIRED

blocking_findings:
  - <remaining blocking IDs>

current_slice:
  status: needs_fixes

next:
  phase: fixes
  action: fix-<slice-id>
  human_approval_required: false
```

For minor-fix verdicts, route by explicit blocking classification.

Run actual project validation. If all blockers are fixed, no regressions exist, and validation passes, prefer `APPROVED`.
