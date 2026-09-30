---
name: design-review
description: Critically review the current work-item design and write an immutable review artifact.
---

# Design Review

Review only.

Read `AGENTS.md`, `.codex/skills/work-orchestrator/references/contract.md`,
workflow state, the design, and referenced `context`. Read earlier reviews only
when the design or an active finding cites them.

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

Classify each actionable finding as `design_defect`, `implementation_defect`, `documentation_defect`, or `state_sync_defect`. Include impact, evidence, correction, and verification. A reconciliation-eligible finding must also pin allowed paths, forbidden changes, acceptance checks, and post-repair destination. Ambiguity is a design defect.

Verdict:
- `APPROVED`
- `APPROVED WITH RECONCILIATION`
- `CHANGES REQUIRED`

Write:

`docs/reviews/<work-item-id>/design-review-XX.md`

Keep the artifact near 3 KB: metadata, a one-line preflight result, the
verdict, and each finding's ID, class, impact, evidence, correction, and
verification. Do not restate the design or list passing checks beyond one line.

Transition deterministically from verdict.

Design defects return to `design`. Exact documentation/state repairs may route to `reconciliation`. Never edit an earlier review artifact.

For `APPROVED`, enter `human_gate` with `status: awaiting_approval`, `gate: design_approval`, `next.action: approve-design`, and `next.on_approval` pinned to the first approved slice. For `APPROVED WITH RECONCILIATION`, install the exact reconciliation contract and destination. For `CHANGES REQUIRED`, enter `design` with `next.action: create-or-revise-design`.
