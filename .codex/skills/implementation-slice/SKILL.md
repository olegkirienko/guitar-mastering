---
name: implementation-slice
description: Implement one approved slice, validate it, and transition workflow state completely to implementation review.
---

# Implementation Slice

Read `AGENTS.md`, workflow state, approved lesson spec, latest relevant approved review, and touched source files.

Implement only the requested slice. Preserve approved decisions. Do not implement future slices, unrelated refactors, speculative abstractions, or unnecessary dependencies.

Run existing lint/typecheck, build, tests if present, and `git diff --check`.

## Required successful transition

Only after implementation and validation succeed:

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

Preserve slice id/name and other required references.

Do not leave `phase: implementation`.
Do not create your own review verdict.
