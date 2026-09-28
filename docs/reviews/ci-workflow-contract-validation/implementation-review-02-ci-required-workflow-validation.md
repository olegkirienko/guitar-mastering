# Implementation Review 02 — CI-required workflow validation

## Review metadata

- **Work item:** `ci-workflow-contract-validation` (`infrastructure`)
- **Slice:** `ci-required-workflow-validation`
- **Authoritative design:** `docs/technical-designs/ci-workflow-contract-validation.md`
- **Implementation commit:** `3813eebfa61e185229687476367d350f2e7af898`
- **Workflow phase reviewed:** `implementation_review`
- **Date:** 2026-09-28
- **Verdict:** `CHANGES REQUIRED`

## Preflight

`PREFLIGHT PASSED`. The fetched canonical branch, unique annotated lifecycle
registration, bootstrap ancestry, workflow identity, Draft PR 15, current
slice, and `implementation_review / ready / none /
review-ci-required-workflow-validation` route agree. The worktree is clean,
the implementation commit is the remote branch head, the approved design and
Design Review 03 exist, and no blocking finding or unapproved later slice is
recorded.

## Implementation assessment

The implemented slice conforms to the approved design. CI invokes the
validator exactly once after dependency installation and before lint. The
validator deterministically discovers direct workflow YAML files, dispatches
them by declared version, enforces identity uniqueness and phase-aware
artifact existence, and preserves the designed completed-history exception.
Its fixtures cover the required positive and negative routes. The foundation
test covers command presence, uniqueness, and ordering.

The full recorded validation passed under Node 24.7.0: workflow validation,
lint/typecheck, 73 unit tests with 19 skipped, 10 browser tests, 19 PostgreSQL
tests, production build, and `git diff --check`. GitHub Actions run
`36442997910` also passed for the exact implementation commit. No unrelated
application, dependency, lockfile, Railway, credential, database, or provider
change was introduced.

The slice cannot advance to merge approval because the current v3.1 merge-gate
contract cannot represent a stable merge-ready checkpoint.

## Blocking finding

### HIGH-02 — Persisted PR head makes the merge gate self-referential

- **Class:** `design_defect`
- **Impact:** The documented final-slice transition requires the workflow to
  persist the exact current PR head SHA before merge approval. Committing that
  workflow transition creates a new PR head, so the persisted SHA is stale as
  soon as it becomes canonical. A subsequent preflight must either reject the
  mismatch or silently weaken exact-head approval; neither is a valid v3.1
  route.
- **Evidence:** The v3.1 contract binds the selected executable ref and merge
  gate scope to `git.head_sha`. The implementation-review transition itself
  must be committed and pushed to the work branch. Therefore no repository
  commit can both contain its own full SHA and remain the current PR head.
  Repeating the update only creates the same mismatch at a new SHA.
- **Correction:** Revise the v3.1 design and contract around a stable
  `reviewed_sha`: persist the exact implementation content approved by review,
  but dynamically resolve the PR head when presenting merge approval. Require
  that head to descend from `reviewed_sha` and that every intervening commit
  changes only explicitly approved control-plane artifacts. Any intervening
  implementation or application change invalidates merge readiness and returns
  to review. Scope the human approval to the exact dynamically presented head,
  re-resolve it after approval, fail closed if it changed, and merge only that
  unchanged head. Persist the resulting main SHA after merge in the normal
  delivery transition. Do not add an external gate record unless design review
  establishes that repository state plus the explicit human response is
  insufficient.
- **Verification:** Contract fixtures must prove accepted control-plane-only
  descendants, rejection of non-descendants and implementation/application
  changes after `reviewed_sha`, exact-head change detection after approval, and
  normal merged-main SHA recording. The current work item must be able to reach
  a stable merge-approval gate without persisting its current PR head.

## Verdict and route

**`CHANGES REQUIRED`**. `HIGH-02` changes v3.1 lifecycle and merge-gate
semantics, so it returns to `design / create-or-revise-design`. It is not a
targeted implementation fix or state-only reconciliation. The implementation
may be retained, but merge approval is prohibited until the revised design is
reviewed and explicitly approved.
