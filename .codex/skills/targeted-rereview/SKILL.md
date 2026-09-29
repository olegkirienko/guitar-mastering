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
- `APPROVED WITH RECONCILIATION`
- `CHANGES REQUIRED`

Create a new immutable review artifact.

If changes remain → `fixes`.

An exact documentation/state repair discovered by re-review may route to `reconciliation`; a behavioral defect remains in `fixes`.

If approved:
- later slice exists → `human_gate / next_slice_approval`
- final v3 slice → `human_gate / work_item_completion`
- final v3.1 slice → persist the exact implementation `reviewed_sha`, then
  commit/push only the immutable re-review and workflow transition. Prove the
  dynamically resolved PR head descends from it with only approved same-item
  control-plane commits, and present that exact head, its successful checks,
  clean tree, and branch-retention proof at `human_gate / merge_approval`.
  Never persist the current PR head or validation-run identity before merge.

Never invent a next slice.

At a gate, set `status: awaiting_approval`, the exact gate, `next.action: approve-<gate>`, and a pinned `next.on_approval`. At reconciliation, install the exact repair contract and `next.on_success`.
