# Implementation Review 01 — CI-required workflow validation

## Review metadata

- **Work item:** `ci-workflow-contract-validation` (`infrastructure`)
- **Slice:** `ci-required-workflow-validation`
- **Authoritative design:** `docs/technical-designs/ci-workflow-contract-validation.md`
- **Implementation commit:** `58ceb54ffe1f9fe5ed671bf62111b06f070e6ac7`
- **Workflow phase reviewed:** `implementation_review`
- **Date:** 2026-09-28
- **Verdict:** `CHANGES REQUIRED`

## Preflight

`PREFLIGHT PASSED`. The fetched canonical branch, unique annotated lifecycle
registration, bootstrap ancestry, workflow identity, Draft PR 15, current
slice, and `implementation_review / ready / none /
review-ci-required-workflow-validation` route agree. The worktree is clean,
the implementation commit is the remote branch head, the approved design and
Design Review 01 exist, and no blocking finding or unapproved later slice is
recorded.

## Implementation assessment

The two implementation edits are narrow and correct against the literal
approved slice. `.github/workflows/ci.yml` adds exactly one normally-failing
`Validate workflow contracts` step immediately after the frozen install and
before lint. It preserves triggers, permissions, job identity, PostgreSQL
service, application checks, and build behavior. The foundation acceptance
test verifies the exact named step, a unique command, both ordering anchors,
and the command's position between them. No dependency, lockfile, Railway,
verifier, application, secret, permission, or topology change was introduced.

The recorded validation is credible and complete: under Node 24.7.0, workflow
contract validation, lint/typecheck, 73 unit tests, 10 browser tests, 19
PostgreSQL tests, production build, and `git diff --check` passed. The initial
sandbox-only localhost `EPERM` is explained by the restricted environment and
the same tests passed unrestricted without a code change.

The slice cannot be approved, however, because inspection of the command now
made mandatory in CI exposes a mismatch between the design's goal and the
validator's actual repository coverage.

## Blocking finding

### HIGH-01 — CI does not validate the repository's active workflow states

- **Class:** `design_defect`
- **Impact:** An invalid active orchestration/control-plane YAML can still
  receive a green `Validate / validate` check. This defeats the stated purpose
  of preventing invalid workflow state from passing otherwise-green CI.
- **Evidence:** `scripts/validate-workflow-contract.mjs` exercises in-memory
  legal/illegal fixtures, reads one v3 installer workflow separately, and at
  its repository-state boundary hard-codes only
  `maintenance-orchestration-simplification.yaml` and
  `maintenance-orchestration-git-lifecycle-v3-1.yaml`. It never discovers or
  reads `docs/workflow/ci-workflow-contract-validation.yaml`, and it also omits
  the active historical `stage-01-lesson-02.yaml`. Running
  `pnpm validate:workflow` therefore says its fixtures passed without proving
  that the workflow state carried by this PR is valid.
- **Correction:** Revise the authoritative design to define declared-version
  validation for every executable/non-terminal workflow in
  `docs/workflow/*.yaml`, while preserving completed historical workflows
  under their original contracts. Specify deterministic discovery,
  version-aware validation, referenced-artifact checks, failure diagnostics,
  tests proving a malformed discovered workflow fails, and the resulting
  implementation slice boundaries. The design must explicitly resolve
  whether terminal historical snapshots are validated structurally or treated
  as inert, rather than relying on a hard-coded allowlist.
- **Verification:** Add a fixture or isolated repository test showing that a
  newly discovered invalid active workflow makes `pnpm validate:workflow`
  exit nonzero, while the current repository and supported completed legacy
  states pass under their declared versions. Then rerun the complete CI
  acceptance command set.

## Verdict and route

**`CHANGES REQUIRED`**. `HIGH-01` changes the required validator coverage and
therefore the approved design, not merely the two implemented lines. Return to
`design / create-or-revise-design`. Do not route directly to targeted fixes or
open merge approval until the revised design receives a new immutable design
review and explicit human approval.
