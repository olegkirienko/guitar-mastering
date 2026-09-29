# Design Review 03 — Completed historical context references

## Review metadata

- **Work item:** `ci-workflow-contract-validation` (`infrastructure`)
- **Current slice:** `ci-required-workflow-validation`
- **Authoritative design:** `docs/technical-designs/ci-workflow-contract-validation.md`
- **Prior review:** `docs/reviews/ci-workflow-contract-validation/design-review-02.md`
- **Workflow phase reviewed:** `design_review`
- **HEAD at review:** `f62e4a1cf03e3668eba73e6d8cbf51c834db3621`
- **Date:** 2026-09-28
- **Verdict:** `APPROVED`

## Preflight

`PREFLIGHT PASSED`. The fetched canonical branch, unique lifecycle
registration, bootstrap ancestry, Draft PR 15, repository/work-item identity,
design path, current slice, and `design_review / ready / none / review-design`
route agree. The branch is clean and the Draft PR head matches the reviewed
commit. The requested clarification changes no application or provider state.

## Clarification assessment

The active-versus-terminal boundary is now explicit and correct. A modern or
legacy state must first satisfy its declared-version route, including the exact
terminal envelope, before any historical-context exception applies. Active and
non-terminal workflows continue to require every context and finding-source
target to exist, so executable work cannot rely on missing inputs.

Completed workflows remain non-executable. Their workflow file is present by
discovery, and their authoritative specification/design, latest immutable
review, and completed-slice final reviews must still exist. Context,
course-map, previous-work, and similar entries remain non-empty repository
paths but may point to resources intentionally removed by the completed work.
This preserves audit history without treating historical inputs as current
execution dependencies.

The exception is appropriately generic and does not introduce a file allowlist
for `.github/workflows/deploy.yml`, `railway.json`, or any future retired path.
The completed legacy-platform-retirement design and immutable reviews already
provide durable authority for those removals. Restoring the retired files
would reverse approved work, while tombstone artifacts would duplicate existing
evidence without improving the validator's trust boundary. Neither is
necessary.

## Full-design assessment

The design remains clear, feasible, and narrowly scoped. Deterministic direct
workflow discovery, version-aware state validation, unique identities,
path-specific diagnostics, and phase-aware artifact checks can be implemented
with Node built-ins and the existing parser. No dependency, secret, network
access, CI topology, Railway behavior, exact-SHA verification, database, or
runtime architecture changes.

The regression plan now covers both sides of the boundary: missing active
context must fail; missing terminal historical context may pass; missing
terminal authoritative design or immutable review must still fail; terminal
states cannot become executable. The existing full command set and rollback
remain proportionate. One slice is still the smallest coherent unit because
the CI step is only meaningful when repository discovery and compatibility
validation ship with it.

## Findings and verdict

No actionable findings. No active blocking findings.

**`APPROVED`**. Transition to `human_gate / design_approval`. The prior
approval was invalidated by the clarified artifact-existence contract and is
not reusable. After new explicit approval, the only legal implementation slice
is `ci-required-workflow-validation`. This review authorizes no implementation
or merge by itself.
