# Design Review 04 — Stable reviewed SHA merge gate

## Review metadata

- **Work item:** `ci-workflow-contract-validation` (`infrastructure`)
- **Current slice:** `ci-required-workflow-validation`
- **Authoritative design:** `docs/technical-designs/ci-workflow-contract-validation.md`
- **Basis finding:** `HIGH-02` in `implementation-review-02-ci-required-workflow-validation.md`
- **Workflow phase reviewed:** `design_review`
- **HEAD at review:** `c181e524144f318c5e6a2130991c7da9535011c1`
- **Date:** 2026-09-28
- **Verdict:** `APPROVED WITH RECONCILIATION`

## Preflight

`PREFLIGHT PASSED`. The fetched canonical branch, unique lifecycle
registration, bootstrap ancestry, Draft PR 15, repository/work-item identity,
design path, current slice, and `design_review / ready / none / review-design`
route agree. The branch is clean and its remote head matches the reviewed
commit. Implementation Review 02 is immutable and supplies active design
finding `HIGH-02`.

## Resolution of HIGH-02

`HIGH-02` is resolved in design. The revised contract persists a stable
`reviewed_sha` for the implementation content accepted by final review and
does not persist either the current pre-merge PR head or its validation-run
identity. The approving review and workflow gate transition may therefore be
committed after the reviewed implementation without claiming that their commit
contains its own SHA.

The post-review envelope is sufficiently narrow and auditable. Every commit
after `reviewed_sha` must be inspected, every changed path is limited to the
same work item's workflow plus a new immutable implementation/fix re-review,
and workflow edits must be legal transitions. Mixed commits, rewritten
evidence, and any design, source, test, CI, configuration, dependency,
operation, or other implementation change invalidate merge readiness and
return to review according to semantic effect.

The gate remains exactly scoped without another mutable ledger. Before asking
for approval, the orchestrator dynamically resolves and presents the exact PR
head, successful checks for that head, reviewed ancestor, PR/target identity,
control-plane-only lineage, and branch-retention proof. After the explicit
response it must fetch again, require the head to be byte-for-byte unchanged,
repeat the lineage/check/retention proof, and use an atomic expected-head merge
primitive. A race or unverifiable response fails closed. Git/GitHub history,
the immutable review, canonical state, and the explicit response are adequate;
an external gate record is not necessary.

The resulting full `main` SHA remains the normal `merged_sha` delivery truth.
The correction does not alter post-merge CI/Railway correlation, branch-tail
semantics, credentials, provider settings, database behavior, or production
operations.

## Scope, feasibility, validation, and recovery

The implementation surface is explicit: project contract, v3.1 lifecycle
design, workflow guide/templates, relevant orchestration/review skills,
validator fixtures and active v3.1 state. Completed workflow YAML and immutable
reviews remain untouched, and no historical SHA is fabricated. The existing
CI validator work and merge-gate correction remain one coherent final slice
because this work item cannot safely leave its own final review under the
defective contract.

The fixture plan covers legal control-plane descendants, non-descendants,
post-review implementation changes, changed heads after presentation, atomic
head binding, and resulting main-SHA recording. The complete repository
validation suite remains required. Rollback is repository-only and introduces
no data, credential, Railway, GitHub-setting, or database recovery action.

## Reconciliation finding

### LOW-01 — README update wording contradicts the approved implementation scope

- **Class:** `documentation_defect`
- **Impact:** The design explicitly requires updating
  `docs/workflow/README.md`, then later says that no README needs an update.
  An implementer could omit a required contract surface or treat the scope as
  ambiguous.
- **Evidence:** The test/documentation section names
  `docs/workflow/README.md` among the v3.1 contract targets. Its closing legacy
  sentence says, “No README, operator runbook, or deployment documentation
  needs an update.”
- **Exact correction:** In
  `docs/technical-designs/ci-workflow-contract-validation.md`, replace only
  that closing statement with wording that requires the workflow README update
  while confirming no operator runbook or deployment documentation change.
- **Allowed paths:**
  `docs/technical-designs/ci-workflow-contract-validation.md` and
  `docs/workflow/ci-workflow-contract-validation.yaml`.
- **Forbidden changes:** No behavior, architecture, accepted risk, slice scope,
  target identity, finding verdict, provider state, credentials, database,
  immutable review, or other design wording may change.
- **Acceptance:** The two documentation statements agree; workflow validation
  and `git diff --check` pass; reconciliation routes directly to a fresh
  `design_approval` gate for `ci-required-workflow-validation`.

## Verdict and route

**`APPROVED WITH RECONCILIATION`**. `HIGH-02` is resolved. Apply only the
`LOW-01` wording repair under the recorded reconciliation contract, then enter
`human_gate / design_approval` without another review. This review authorizes
neither implementation nor merge by itself.
