# Implementation Review 03 — Reviewed-SHA merge-gate contract

## Review metadata

- **Work item:** `ci-workflow-contract-validation` (`infrastructure`)
- **Slice:** `ci-required-workflow-validation`
- **Authoritative design:** `docs/technical-designs/ci-workflow-contract-validation.md`
- **Implementation commit:** `5e02df62938bf97fbbfa2d474bc7ddddadf9c636`
- **Workflow phase reviewed:** `implementation_review`
- **Date:** 2026-09-29
- **Verdict:** `CHANGES REQUIRED`

## Preflight and validation

`PREFLIGHT PASSED`. The fetched canonical branch, unique annotated lifecycle
registration, bootstrap ancestry, workflow identity, Draft PR 15, current
slice, and `implementation_review / ready / none /
review-ci-required-workflow-validation` route agree. The worktree is clean and
the implementation commit is the remote branch head.

Local validation passed under Node 24.7.0: workflow validation, lint/typecheck,
73 unit tests with 19 skipped, 10 browser tests, an isolated PostgreSQL rerun
with 19 passing tests after one transient pre-existing rate-limiter timing
failure, production build, and `git diff --check`. PR validation run
`36535996525` was pending during review and is not used to waive either
finding.

## Implementation assessment

The implementation correctly replaces persisted `head_sha` with
`reviewed_sha` across active state, templates, contract documentation, skills,
and validator fixtures. Stable merge-gate scope omits current head and check
run. The new model verifies reviewed ancestry, restricts post-review paths to
the same workflow and new immutable review artifacts, rejects
implementation/application changes, compares the post-approval presentation,
requires an atomic expected head, and preserves normal `merged_sha` delivery
truth. Completed workflows and immutable reviews are unchanged.

Two fail-closed gaps remain in the validator model.

## Blocking findings

### MEDIUM-01 — Dynamic merge candidate does not cross-check canonical and PR heads

- **Class:** `implementation_defect`
- **Impact:** `resolveMergeCandidate` accepts one caller-supplied `headSha` and
  validates checks/lineage against that value, but it never proves that the
  fetched canonical remote branch head and the live PR head both equal it. A
  stale or mismatched observation could therefore be presented as the exact
  candidate despite the design requiring dynamic canonical/PR resolution.
- **Evidence:** The observation fixture has `headSha` only. There are no
  `remoteBranchHeadSha` and `prHeadSha` comparisons or negative fixtures for a
  canonical/PR mismatch. Executable-ref ancestry validation is separate and
  does not bind this live gate observation.
- **Correction:** Require full `remoteBranchHeadSha` and `prHeadSha` values and
  equality among both and the presented `headSha`. Call `validateState` before
  consuming stable gate scope. Add negative fixtures for each mismatch.
- **Verification:** The legal candidate passes only when all three exact SHAs
  agree; changing either live source fails before presentation and before
  approval consumption.

### MEDIUM-02 — Stale reviewed SHA is legal in pre-review gates and reconciliation

- **Class:** `implementation_defect`
- **Impact:** A stale `reviewed_sha` can survive a design/next-slice/operational
  human gate or reconciliation even though no final approved implementation is
  merge-ready. This weakens the field's meaning and could later be mistaken for
  current review evidence.
- **Evidence:** `validateState` clears `reviewed_sha` in behavioral phases but
  does not require null for `reconciliation` or for human gates other than
  `merge_approval` and post-delivery `work_item_completion`.
- **Correction:** Require `reviewed_sha: null` for reconciliation and every
  pre-merge human gate other than `merge_approval`; retain a full reviewed SHA
  only for merge approval, delivery verification, work-item completion, and
  terminal history. Add negative fixtures for stale values at design approval
  and reconciliation.
- **Verification:** Legal phase fixtures still round-trip; stale reviewed SHA
  fixtures fail; merge and post-merge fixtures retain the reviewed SHA.

## Verdict and route

**`CHANGES REQUIRED`**. Apply only `MEDIUM-01` and `MEDIUM-02` in
`scripts/validate-workflow-contract.mjs`, update workflow state, rerun the full
acceptance set, and route to immutable fix re-review. No design, application,
provider, dependency, Railway, credential, database, or historical artifact
change is authorized.
