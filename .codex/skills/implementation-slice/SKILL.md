---
name: implementation-slice
description: Implement exactly one approved slice for any work-item type and transition to implementation review.
---

# Implementation Slice

Read:
- `AGENTS.md`
- workflow state
- authoritative design
- context references
- latest relevant approved review
- relevant source files

Implement only the current slice.

Do not implement future slices, speculative abstractions, or unrelated cleanup.

Run repository validation required by the design and AGENTS.md.

After success:

```yaml
phase: implementation_review
status: ready
gate: none
current_slice:
  status: implemented
blocking_findings: []
next:
  phase: implementation_review
  action: review-<slice-id>
  human_approval_required: false
```

Do not create your own review verdict.
