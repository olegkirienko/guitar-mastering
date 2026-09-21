# Fix Re-Review 08 — GitHub main validation

## Review metadata

- **Work item:** `railway-ci-cd-iac`
- **Type:** `infrastructure`
- **Slice:** `github-main-validation`
- **Owning review:**
  `docs/reviews/railway-ci-cd-iac/implementation-review-07-github-main-validation.md`
- **Active finding reviewed:** `MEDIUM-02`
- **Current HEAD SHA:** `dda15469df039e3cbb349d6b3a02f2b015988665`
- **Date:** 2026-09-21
- **Artifact identifier:** `fix-rereview-08-github-main-validation`
- **Verdict:** `APPROVED`

## Preflight and scope

`PREFLIGHT PASSED`. The workflow state routes canonically to `fix_rereview`,
has no gate, identifies the fixed `github-main-validation` slice, keeps exactly
`MEDIUM-02` active pending verification, and references the existing approved
design and owning immutable review. The authoritative design contains a later
approved slice, `deployment-metadata-and-runbook`; the current slice is not the
final slice.

This re-review verifies only `MEDIUM-02` and direct regressions from its fix. It
does not reopen the accepted CI workflow, GitHub ruleset, exact-SHA validation,
or earlier findings, and it does not review or authorize a later slice. No
application code, CI workflow, IaC source, dependency, GitHub setting, secret,
or Railway resource was changed by the targeted fix or this re-review.

## Finding disposition

### MEDIUM-02 — FIXED

The authoritative design now records the implemented `github-main-validation`
slice, the unconditional pull-request and `main` push triggers, removal of
manual dispatch, active ruleset `23761397`, and the public repository state.
Its current status and slice-routing statements consistently keep later work
unauthorized until this re-review and the separate `next_slice_approval` gate.

The obsolete private-repository credential requirement is no longer presented
as current authorization. The design instead requires a narrow amendment,
immutable design review, and explicit approval before
`railway-github-autodeploy` may select either anonymous or authenticated
GitHub Actions API access. It preserves fail-closed behavior and the restricted
token lifecycle requirements if authentication is ultimately selected, while
authorizing neither token provisioning nor anonymous access now.

The operator record labels `1d95822ceafb5901199247df26e53112c7bee4d9` as the
pre-activation remote `main` baseline, removing the misleading implication that
it is the current accepted SHA. Dated historical evidence remains intact.

These changes satisfy the owning review's targeted-fix instructions. The fix
is confined to the authoritative design, operator record, and workflow state,
and no direct regression was introduced.

## Validation

- Targeted fix commit `9018dc3396d3fdc5fc945f4120658d9b2577e744` changed
  only the authoritative design, operator record, and workflow state.
- Node `24.7.0` `pnpm lint` — passed.
- Workflow YAML parsing and `fix_rereview` state assertions — passed.
- `git diff --check` — passed before this review artifact/state transition.
- No provider command or remote mutation was executed during this re-review.

## Verdict and transition

**Verdict: `APPROVED`**

`MEDIUM-02` is closed. A later approved slice exists in the authoritative
design: `deployment-metadata-and-runbook`. Transition to
`human_gate / next_slice_approval`. Explicit approval of that newly current
gate is required before slice 3 may begin; the request that initiated this
`fix_rereview` phase cannot be consumed prospectively as gate approval.
