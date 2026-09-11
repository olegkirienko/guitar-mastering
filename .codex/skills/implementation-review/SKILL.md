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

Verdict:
- `APPROVED`
- `APPROVED WITH MINOR FIXES`
- `CHANGES REQUIRED`

Write immutable artifact:

`docs/reviews/<work-item-id>/implementation-review-XX-<slice>.md`

If changes required, route to `fixes` with exact blocking IDs.

If approved:
- later approved slice exists → `human_gate / next_slice_approval`
- final slice → `human_gate / work_item_completion`

Never invent a next slice.
