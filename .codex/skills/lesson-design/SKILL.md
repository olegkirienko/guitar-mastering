---
name: lesson-design
description: Create/revise a lesson design artifact and transition workflow state completely to design review.
---

# Lesson Design

Read `AGENTS.md`, relevant course map, prior lesson design when needed, and workflow state.

Use the discovery sequence:
`experience → question → prediction → experiment → observation → pattern → concept/name → guitar application → checkpoint → bridge`.

Do not modify application code.

Write/update `docs/lesson-designs/<lesson-slug>.md`.

After successful completion:

```yaml
phase: design_review
status: ready
gate: none

next:
  phase: design_review
  action: review-design
  human_approval_required: false
```

Do not leave `phase: design`.
