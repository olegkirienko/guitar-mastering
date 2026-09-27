---
name: implementation-review
description: Review one implemented slice for any work-item type and transition deterministically.
---

# Implementation Review

Review only; do not modify application code.

Always review:
- design compliance;
- correctness;
- scope discipline;
- maintainability;
- regressions;
- validation.

Add domain-specific dimensions from work-item type/design, such as:
- pedagogy/accessibility;
- security/authentication/authorization;
- persistence/data integrity;
- API contracts;
- migrations;
- runtime/deployment behavior;
- privacy;
- compatibility.

Use stable finding IDs.

Classify each actionable finding. `design_defect` returns to design; `implementation_defect` routes to targeted fixes; exact `documentation_defect` or `state_sync_defect` may route to reconciliation. When any behavioral finding is active, it takes precedence and all findings use the reviewed fix/re-review path.

Verdict:
- `APPROVED`
- `APPROVED WITH RECONCILIATION`
- `CHANGES REQUIRED`

Write immutable artifact:

`docs/reviews/<work-item-id>/implementation-review-XX-<slice>.md`

If changes required, route to `fixes` with exact blocking IDs.

If approved with reconciliation, record the exact repair contract, allowed paths, forbidden effects, acceptance checks, and post-repair destination. Do not create a second review merely to verify that bounded repair.

If approved:
- later approved slice exists → `human_gate / next_slice_approval`
- final slice → `human_gate / work_item_completion`

Never invent a next slice.

At a gate, set `status: awaiting_approval`, the exact gate, `next.action: approve-<gate>`, and a pinned `next.on_approval`. At reconciliation, install the exact repair contract and `next.on_success`. At fixes, retain typed findings and use `next.action: fix-<finding-ids>`.
