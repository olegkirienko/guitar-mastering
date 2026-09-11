---
name: implementation-review
description: Review a slice and transition to fixes, next-slice approval, or terminal lesson completion.
---

# Implementation Review

Review only; do not modify application code.

Use verdict exactly:
- `APPROVED`
- `APPROVED WITH MINOR FIXES`
- `CHANGES REQUIRED`

Create a new immutable review artifact.

## CHANGES REQUIRED

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

## APPROVED

Inspect the approved lesson specification before transitioning.

If another implementation slice exists:

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

If current slice is final:

```yaml
phase: human_gate
status: approved
gate: lesson_completion
latest_review:
  path: <new review path>
  verdict: APPROVED
blocking_findings: []
current_slice:
  status: approved
next:
  phase: complete
  action: complete-lesson
  human_approval_required: true
```

Never emit `begin-next-approved-slice` if no later slice exists.
