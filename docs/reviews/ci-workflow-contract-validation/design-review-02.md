# Design Review 02 — Discovered workflow-state validation

## Review metadata

- **Work item:** `ci-workflow-contract-validation` (`infrastructure`)
- **Current slice:** `ci-required-workflow-validation`
- **Authoritative design:** `docs/technical-designs/ci-workflow-contract-validation.md`
- **Prior implementation review:** `docs/reviews/ci-workflow-contract-validation/implementation-review-01-ci-required-workflow-validation.md`
- **Workflow phase reviewed:** `design_review`
- **HEAD at review:** `4bf8bbcddda58e60cdf47865ce8ec424c105c911`
- **Date:** 2026-09-28
- **Verdict:** `APPROVED`

## Preflight

`PREFLIGHT PASSED`. The fetched canonical branch, unique lifecycle
registration, bootstrap ancestry, Draft PR, work-item identity, design path,
current slice, and `design_review / ready / none / review-design` route agree.
Implementation Review 01 is immutable and supplies active design finding
`HIGH-01`; the revised design retains exactly one implementation slice and
does not claim current workflow routing.

## Resolution of HIGH-01

`HIGH-01` is resolved in design. The revision no longer assumes that invoking
the existing command validates repository workflow state. It explicitly
identifies the hard-coded two-file boundary and requires lexically ordered
discovery of every direct `docs/workflow/*.yaml` file, including the current
v3.1 work item and active historical v1 lesson.

The declared-version policy is sufficiently precise and fail-closed. Existing
v3/v3.1 parsing and state validation remain authoritative for modern states;
completed v1/v2 compatibility is bounded to terminal historical envelopes;
the one active v1 approval envelope is supported without migration; and an
active v2 state is rejected until explicitly migrated or designed. Duplicate
identity, unsupported version/state, malformed input, missing evidence, and
validation errors must name the discovered path and fail the command.

The evidence policy covers authoritative design/specification, context and
course-map, latest review, active finding sources, and legacy final reviews.
Remote Git, tag, PR, CI, and provider correlation correctly remains outside a
static checkout validator and inside orchestration preflight.

## Full-design assessment

The revised goal, non-goals, implementation boundary, and rollback are clear.
The approach is feasible with Node built-ins and the existing parser, adds no
dependency or secret, performs no write or network operation, and leaves CI
topology, permissions, job identity, Railway sequencing, and exact-SHA
verification unchanged.

Validation is proportionate and regression-oriented. It covers deterministic
discovery, template exclusion, version dispatch, identity uniqueness,
supported historical compatibility, unsupported active legacy behavior,
missing artifacts, an invalid newly discovered modern state, and path-specific
failure diagnostics. The existing foundation assertion continues to own CI
step presence, uniqueness, and ordering. The full repository command set is
required before implementation review.

The single slice remains coherent: the already implemented CI/test edits and
the validator boundary must succeed together for the user-visible required
check to mean what the design claims. Splitting them would create an
intermediate green CI step with knowingly incomplete coverage. No speculative
abstraction, provider mutation, data migration, or historical workflow rewrite
is introduced.

## Findings and verdict

`HIGH-01` resolved. No new actionable findings. No active blocking findings.

**`APPROVED`**. Transition to `human_gate / design_approval`. Because the
approved implementation scope now includes validator discovery and legacy
compatibility behavior, the earlier consumed approval is not reusable. After
new explicit approval, the only legal slice is
`ci-required-workflow-validation`; the existing partial implementation may be
retained, but no validator implementation is authorized by this review alone.
