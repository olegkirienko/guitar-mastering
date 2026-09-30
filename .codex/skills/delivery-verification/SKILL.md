---
name: delivery-verification
description: Verify one exact merged SHA across GitHub CI and Railway delivery, then route deterministically.
---

# Delivery Verification

Read `AGENTS.md`, `.codex/skills/work-orchestrator/references/contract.md`,
workflow state, authoritative design, primary PR metadata, and the existing
Railway CI/CD operations contract.

This phase is read-only, including at `verify-delivery` and
`retry-delivery-<NN>`. The only production mutation is the single pinned
operation performed while a post-merge `production_mutation_approval` gate is
being used (see Production retry). Resolve only the canonical work branch and
reject missing, ambiguous, inherited, or terminal identities.

When Railway evidence is required, read
[references/railway-evidence.md](references/railway-evidence.md) before making
provider requests. Its default is one command,
`corepack pnpm evidence:delivery --sha <merged SHA>`, which prints only the
required facts. Request and expose only the exact fields and bounded log
events needed for the current proof. Never emit complete provider JSON, full
build/runtime logs, variables, credentials, or unredacted configuration. If a
narrow result omits a required fact, query only that missing fact or fail
closed; absence from a projection is not positive evidence.

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
## Production retry

A production redeploy, restart, rollback, or migration retry after merge
enters `human_gate / production_mutation_approval` from this phase. The
`gate_scope` pins the provider, environment, targets, exact operation,
`merged_sha`, and stop conditions that name `delivery:retry-guard`.
`next.on_approval` is `delivery_verification / retry-delivery-<NN>`, where `NN`
numbers the retries from `01`. While the gate is being used:

1. Re-resolve the workflow and scope, and re-check the stop conditions.
2. As the last read, run
   `corepack pnpm delivery:retry-guard --mode pre --sha <merged SHA>`.
   - A temporary stop leaves the gate unconsumed.
   - A permanent stop is resolved only by the owner withdrawing the gate to
     `verify-delivery`, before any operation. Withdrawal keeps both SHAs
     unchanged, and the delivery evidence records the guard's reason.
3. Issue the operation exactly once. Issuing it consumes the gate.
4. Run `corepack pnpm delivery:retry-guard --mode post --sha <merged SHA> --retry-deployment <id>`.
5. If it clears, enter `retry-delivery-<NN>`. Otherwise, or if the operation
   returned no deployment ID, enter
   `delivery_verification / blocked / supply-retry-<NN>-owner-decision`.

`retry-delivery-<NN>` runs `--mode post` without an ID before collecting
evidence, and a stop blocks the same way. Any further mutation needs a new gate
with the next `NN`. Record each retry's scope, operation, deployment ID, guard
results, and outcome in the delivery evidence.
