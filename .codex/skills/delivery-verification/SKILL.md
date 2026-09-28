---
name: delivery-verification
description: Verify one exact merged SHA across GitHub CI and Railway delivery, then route deterministically.
---

# Delivery Verification

Read `AGENTS.md`, workflow state, authoritative design, primary PR metadata,
and the existing Railway CI/CD operations contract.

This phase is read-only unless `next.action` records a bounded safe retry or a
separate typed production gate authorizes mutation. Resolve only the canonical
work branch and reject missing, ambiguous, inherited, or terminal identities.

Correlate the exact full `git.merged_sha` through protected `main`, the primary
PR result, a push-event GitHub `Validate` run, Railway source metadata and
`WAITING`, the pre-deploy `RAILWAY_GIT_COMMIT_SHA` verifier, migration,
startup/readiness, and production smoke. Reject every SHA mismatch. Record a
secret-safe immutable artifact at
`docs/delivery-evidence/<work-item-id>/delivery-XX.md`.

On success, commit and push the evidence and workflow checkpoint on the
retained canonical branch, then enter `human_gate / work_item_completion` with
gate scope pinning `git.merged_sha` and `delivery.evidence_path`.

An evidenced code defect routes through fixes/re-review and a narrowly scoped
remediation PR. A design defect returns to design. Provider outages remain in
delivery verification; exact evidence/state wording may use reconciliation.
Production redeploy, restart, rollback, or migration retry requires the
existing scoped production mutation gate.
