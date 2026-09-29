# Design Review 01 — CI workflow contract validation

## Review metadata

- **Work item:** `ci-workflow-contract-validation` (`infrastructure`)
- **Authoritative design:** `docs/technical-designs/ci-workflow-contract-validation.md`
- **Workflow phase reviewed:** `design_review`
- **Canonical branch:** `work/ci-workflow-contract-validation`
- **HEAD at review:** `0d264b397674b90e148cb421ef865d62885c0e74`
- **Date:** 2026-09-28
- **Verdict:** `APPROVED`

## Preflight

`PREFLIGHT PASSED`. The fetched canonical branch, workflow identity, and open
Draft PR 15 agree on the repository, work-item ID, branch, lifecycle
generation, and full head SHA. Exactly one annotated lifecycle registration
targets bootstrap anchor `33b72f5b593a7dd28bb361021a0a7713467c73d3`,
and that anchor is in canonical-branch ancestry. The workflow is consistently
routed as `design_review / ready / none / review-design`; its design and
context artifacts exist, it has no completed implementation slice, review,
gate, or blocking finding, and the authoritative design defines exactly one
approved implementation slice.

## Design assessment

The goal and boundary are clear. The design adds the existing
`pnpm validate:workflow` command to the existing `Validate / validate` job and
does not redesign the validator, CI topology, branch protection, Railway
delivery, or application validation. Its non-goals and acceptance criteria
make preservation of triggers, permissions, services, downstream steps,
dependencies, and exact-SHA delivery behavior directly reviewable.

The proposed ordering is correct and feasible. The validator uses Node
built-ins and repository files, so it has the runtime it needs immediately
after the existing Node, pnpm, and frozen-install setup. Placing it before
lint, tests, database integration, and build makes invalid control-plane state
fail the job through normal GitHub Actions semantics before expensive work.
No condition, retry, or failure suppression weakens that behavior.

The existing production verifier remains compatible. It requires one
successful `Validate` workflow and one successful `validate` job for the exact
`main` SHA, then checks a stable named subset of successful steps. Adding an
extra required-to-succeed step to that job strengthens the upstream gate
without changing the verifier contract or Railway sequencing.

The validation strategy is proportionate. Extending the existing foundation
acceptance boundary to assert one invocation and its position between frozen
install and lint detects omission, duplication, and ordering regressions. The
full command set covers the validator itself and all preserved CI stages.
Rollback is a reviewed revert of the two scoped edits; there is no data,
credential, database, provider, or topology recovery concern.

Security and operations are appropriately constrained: permissions remain
read-only, no secret or network access is introduced, the named step exposes
normal logs, and runner cost is negligible. The single slice owns both the CI
change and its focused regression assertion, is independently testable, and
introduces no unnecessary abstraction or dependency.

## Findings and verdict

No actionable findings. No active blocking findings.

**`APPROVED`**. Transition to `human_gate / design_approval`. The first and
only legal implementation slice after explicit approval is
`ci-required-workflow-validation`. This review authorizes no implementation or
merge by itself.
