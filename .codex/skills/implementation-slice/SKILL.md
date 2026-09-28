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

For v3.1, operate only from the resolved canonical work branch after its unique
annotated lifecycle registration, bootstrap anchor, workflow claims, and
ancestry agree. Meaningful checkpoints update the single Draft PR; never create
a routine second PR or push directly to `main`. Reject missing/ambiguous
identity and terminal refs.

Do not implement future slices, speculative abstractions, or unrelated cleanup.

Run repository validation required by the design and AGENTS.md.

After success:

```yaml
phase: implementation_review
status: ready
gate: none
current_slice:
  id: <slice-id>
  name: <slice-name>
blocking_findings: []
next:
  action: review-<slice-id>
```

Do not create your own review verdict.
