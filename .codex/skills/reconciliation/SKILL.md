---
name: reconciliation
description: Apply one exact non-behavioral documentation or workflow-state repair and transition without redundant re-review.
---

# Reconciliation

Read `AGENTS.md`, workflow state, authoritative design, the immutable basis review or unambiguous repository fact, and every allowed target path.

Preflight must prove:

- every active finding is `documentation_defect` or `state_sync_defect`;
- the workflow records one reconciliation ID, exact basis and finding IDs, allowed paths, acceptance checks, and `next.on_success`;
- the repair introduces no decision and changes no behavior, architecture, accepted risk, scope, target identity, review verdict, provider state, credential, database, or immutable artifact;
- no design or implementation defect is active.

If any condition is uncertain, stop and promote to design or implementation review. Do not guess.

Edit only `reconciliation.allowed_paths` and satisfy only the recorded acceptance checks. Run the recorded validation.

On success, atomically:

- close only the named findings by removing them from `blocking_findings`;
- remove `reconciliation`;
- install the exact `next.on_success` destination with its implied status and gate;
- optionally record `last_reconciliation` with only ID, date, basis path, and validation result.

Do not create a new review artifact. The owning review remains immutable evidence.
