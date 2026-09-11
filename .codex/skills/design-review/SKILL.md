---
name: design-review
description: Critically review the current work-item design and write an immutable review artifact.
---

# Design Review

Review only.

Always assess:
- goal clarity;
- scope/non-goals;
- correctness;
- implementation feasibility;
- risks;
- validation strategy;
- slice boundaries;
- unnecessary abstraction.

Additional dimensions:
- lesson → pedagogy, theory, accessibility, cognitive load;
- technical_feature → architecture, security, auth/authz where relevant, data integrity, API contracts, migrations, deployment, privacy;
- refactor → preserved behavior and regression/migration risk;
- infrastructure → security, operations, recovery, deployment/rollback.

Use stable finding IDs.

Verdict:
- `APPROVED`
- `APPROVED WITH MINOR FIXES`
- `CHANGES REQUIRED`

Write:

`docs/reviews/<work-item-id>/design-review-XX.md`

Transition deterministically from verdict.
