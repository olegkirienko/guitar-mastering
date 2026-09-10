---
name: targeted-fix
description: Fix only active blocking finding IDs, validate, and transition completely to targeted re-review.
---

# Targeted Fix

Read `AGENTS.md`, workflow state, approved spec, latest review containing active findings, and source files named by findings.

Use `blocking_findings` from workflow state unless the user explicitly narrows the set.

Fix only selected findings. Do not add unrelated cleanup, future lesson work, speculative abstractions, or review/spec rewrites.

Run existing lint/typecheck, build, tests if present, and `git diff --check`.

## Required successful transition

```yaml
phase: fix_rereview
status: ready
gate: none

current_slice:
  status: fixed

blocking_findings:
  - <same target IDs pending verification>

next:
  phase: fix_rereview
  action: rereview-<slice-id>
  human_approval_required: false
```

Do not clear blocking findings before re-review verifies them.
Do not create a review verdict.
