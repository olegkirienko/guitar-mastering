# Fix Re-Review 01 — Dynamic merge-head hardening

## Review metadata

- **Work item:** `ci-workflow-contract-validation` (`infrastructure`)
- **Slice:** `ci-required-workflow-validation`
- **Fix commit:** `a9e12b1e40b813c7d452a7eec1a316381c6ebdf3`
- **Owning review:** `implementation-review-03-ci-required-workflow-validation.md`
- **Date:** 2026-09-29
- **Verdict:** `CHANGES REQUIRED`

## Preflight and validation

`PREFLIGHT PASSED`. Canonical branch, lifecycle registration, ancestry, Draft
PR 15, workflow identity, active findings, and
`fix_rereview / ready / none / rereview-ci-required-workflow-validation`
agree. The fix commit is the remote branch head and the worktree is clean.

Workflow validation, lint/typecheck, 73 unit tests with 19 skipped, 10 browser
tests, 19 PostgreSQL tests, production build, and `git diff --check` passed
under Node 24.7.0.

## Finding verification

### MEDIUM-01 — Dynamic merge candidate does not cross-check canonical and PR heads

Status: **FIXED**.

`resolveMergeCandidate` now validates the canonical workflow state, requires
full `remoteBranchHeadSha` and `prHeadSha` observations, and requires both to
equal the exact presented head. Separate negative fixtures reject each mismatch
before gate presentation or consumption.

### MEDIUM-02 — Stale reviewed SHA is legal in pre-review gates and reconciliation

Status: **FIXED**.

The validator now permits non-null `reviewed_sha` only at merge approval and
post-merge delivery/completion states. All other phases and gates require null.
Legal v3.1 design-approval and reconciliation fixtures round-trip, while stale
reviewed-SHA variants fail.

## Direct regression

### MEDIUM-03 — Targeted re-review skill retains the superseded pinned-head instruction

- **Class:** `implementation_defect`
- **Impact:** A final slice approved through fix re-review could follow the
  repository-local skill and persist or otherwise pin the current pushed head,
  recreating the self-reference defect that the implementation removes.
- **Evidence:** `.codex/skills/targeted-rereview/SKILL.md` still says final v3.1
  approval occurs after “the exact pushed head, PR checks, clean tree, and
  branch-retention proof are pinned.” The implementation-review skill and
  contract now require persisted `reviewed_sha` plus a dynamically presented
  current head/check run.
- **Correction:** Replace only the final-v3.1 routing paragraph in
  `.codex/skills/targeted-rereview/SKILL.md` with the same reviewed-SHA,
  control-plane-descendant, dynamic presentation, and no-premerge-head-
  persistence rule used by implementation review.
- **Verification:** Repository search finds no active orchestration/review
  instruction to persist or pin the current pre-merge head; workflow validation
  and `git diff --check` pass.

## Verdict and route

**`CHANGES REQUIRED`**. `MEDIUM-01` and `MEDIUM-02` are closed.
Apply only `MEDIUM-03`, then return to fix re-review. Do not alter validator
behavior, design, application code, provider state, or historical evidence.
