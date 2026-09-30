---
name: implementation-slice
description: Implement exactly one approved slice for any work-item type and transition to implementation review.
---

# Implementation Slice

Read:
- `AGENTS.md` and `.codex/skills/work-orchestrator/references/contract.md`
- workflow state
- the authoritative design: the current slice plus goal, non-goals,
  constraints/safety, acceptance criteria, and any amendments
- context references
- latest relevant approved review
- source files the slice changes and their direct dependencies

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
