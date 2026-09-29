# Fix Re-Review 02 — Targeted re-review routing

## Review metadata

- **Work item:** `ci-workflow-contract-validation` (`infrastructure`)
- **Slice:** `ci-required-workflow-validation`
- **Reviewed implementation SHA:** `3ac28286d836387c45882e6a44df9a5be605014d`
- **Owning review:** `fix-rereview-01-ci-required-workflow-validation.md`
- **Date:** 2026-09-29
- **Verdict:** `APPROVED`

## Preflight and validation

`PREFLIGHT PASSED`. Canonical branch, lifecycle registration, bootstrap
ancestry, Draft PR 15, workflow identity, active `MEDIUM-03`, current slice,
and `fix_rereview / ready / none /
rereview-ci-required-workflow-validation` agree. The reviewed implementation
SHA is the clean remote branch head.

Under Node 24.7.0, workflow validation covered 30 legal states, 8 illegal
states, 16 transitions, and 8 repository workflows. Lint/typecheck, 73 unit
tests with 19 skipped, 10 browser tests, 19 PostgreSQL tests, production build,
and `git diff --check` all passed.

## Finding verification

### MEDIUM-03 — Targeted re-review skill retains the superseded pinned-head instruction

Status: **FIXED**.

The final-v3.1 route in `.codex/skills/targeted-rereview/SKILL.md` now matches
the reviewed contract: persist the exact implementation `reviewed_sha`, allow
only the new immutable re-review plus workflow transition afterward, prove the
live PR head is a control-plane-only descendant, present its checks and
retention evidence dynamically, and never persist current PR head or
validation-run identity before merge.

Repository search across active orchestration/review skills, `AGENTS.md`, the
workflow guide/templates, and the v3.1 lifecycle design finds no remaining
instruction to persist or pin the current pre-merge head. Provider/API
`head_sha` fields used by the independent post-merge exact-SHA verifier are
unchanged and correctly outside this contract.

## Regression and scope assessment

No direct regression. The fix changes only the named skill and workflow
transition. Validator behavior, approved design, application code, completed
workflow YAML, immutable prior reviews, package/lock files, Railway behavior,
credentials, databases, and provider state remain unchanged.

The authoritative design contains one approved slice, so this is the final
slice. The exact implementation content approved by this review is
`3ac28286d836387c45882e6a44df9a5be605014d`.

## Verdict and route

**`APPROVED`**. Close `MEDIUM-03`, persist the exact reviewed implementation
SHA above, and transition to `human_gate / merge_approval`. The repository gate
stores only stable repository/branch/generation/PR/target/reviewed-SHA scope.
The current PR head, its required checks, control-plane lineage, clean-tree
proof, and branch-retention proof must be resolved and presented dynamically
after this review/gate commit is pushed. This review does not authorize merge.
