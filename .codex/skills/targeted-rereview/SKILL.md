---
name: targeted-rereview
description: Re-review active fixes for any work-item type and transition deterministically.
---

# Targeted Re-Review

Verify only active blocking IDs plus direct regressions.

Per finding:
- `FIXED`
- `PARTIALLY FIXED`
- `NOT FIXED`
- `REGRESSED`

Verdict:
- `APPROVED`
- `APPROVED WITH MINOR FIXES`
- `CHANGES REQUIRED`

Create a new immutable review artifact.

If changes remain → `fixes`.

If approved:
- later slice exists → `human_gate / next_slice_approval`
- final slice → `human_gate / work_item_completion`

Never invent a next slice.
