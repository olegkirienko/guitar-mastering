---
name: design-review
description: Review a lesson design artifact, write an immutable review, and transition completely to human gate or design revision.
---

# Design Review

Do not modify application code or silently rewrite the design.

Use stable finding IDs and verdict exactly:
- `APPROVED`
- `APPROVED WITH MINOR FIXES`
- `CHANGES REQUIRED`

Create `docs/reviews/<lesson-id>/design-review-XX.md`.

## APPROVED

```yaml
phase: human_gate
status: approved
gate: design_approval

latest_review:
  path: <new review path>
  verdict: APPROVED

blocking_findings: []

next:
  phase: implementation
  action: begin-approved-implementation
  human_approval_required: true
```

## CHANGES REQUIRED

```yaml
phase: design
status: changes_required
gate: none

latest_review:
  path: <new review path>
  verdict: CHANGES REQUIRED

blocking_findings:
  - <blocking IDs>

next:
  phase: design
  action: revise-design
  human_approval_required: false
```

For minor-fix verdicts, route by explicit blocking classification.
