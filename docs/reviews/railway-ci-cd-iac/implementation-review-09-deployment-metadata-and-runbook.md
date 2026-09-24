# Implementation Review 09 — Deployment metadata and runbook

## Review metadata

- **Work item:** `railway-ci-cd-iac`
- **Type:** `infrastructure`
- **Slice:** `deployment-metadata-and-runbook`
- **Authoritative design:** `docs/technical-designs/railway-ci-cd-iac.md`
- **Base HEAD reviewed:** `156990149fdaecdf032ca923e0a1190069bc93e8`
- **Date:** 2026-09-21
- **Verdict:** `APPROVED`

## Preflight and scope

`PREFLIGHT PASSED`. The workflow state identifies the approved design, routes
canonically to `implementation_review`, names the implemented
`deployment-metadata-and-runbook` slice, has no gate or active finding, and
references artifacts that exist. The authoritative design contains two later
approved slices, beginning with `railway-github-autodeploy`; this is not the
final slice.

This review covers only runtime deployment-version resolution, its tests, the
preserved IaC fallback, contributor guidance, production cutover guidance, and
the CI/CD and Railway operations runbook. It does not authorize a GitHub source
connection, Wait for CI, autodeploy, verifier implementation, credential,
production variable change, deployment, migration, or IaC apply.

## Assessment

The implementation satisfies the approved slice. Runtime configuration prefers
a nonempty, full 40-character `RAILWAY_GIT_COMMIT_SHA`, rejects malformed Git
metadata, and retains required `DEPLOYMENT_VERSION` fallback behavior when Git
metadata is absent. Existing startup and request logging therefore receive the
resolved full version without changing public health or readiness responses.
Focused tests cover Git metadata precedence, fallback behavior, malformed
metadata, and the missing-fallback failure path.

The Railway IaC source continues to preserve `DEPLOYMENT_VERSION` and documents
why it must remain through transition acceptance. No source connection,
autodeploy setting, pre-deploy verifier, dependency, secret, production
variable, or remote infrastructure mutation was introduced.

The documentation covers the required canonical release path, exact-SHA
correlation, contributor boundary, manual IaC plan/apply and drift procedure,
CI failure and timeout diagnosis, migration/pre-deploy failure, readiness and
startup failure, SHA mismatch, rollback, and evidence capture. It clearly
distinguishes the current manual production path from the future gated target
and keeps the credential-mode amendment and later operator actions
unauthorized.

The changes remain narrowly scoped, use the existing configuration and logging
interfaces, and introduce no speculative abstraction or public version
endpoint. No correctness, security, compatibility, maintainability, scope, or
regression finding was identified.

## Validation

- Node `24.7.0` `pnpm lint` — passed.
- `pnpm test` — passed: 59 passed, 19 skipped.
- `pnpm test:browser` — passed: 10 passed.
- `pnpm test:postgres` — passed: 19 passed.
- `pnpm build` — passed.
- `git diff --check` — passed before this review artifact/state transition.
- The first sandboxed unit run could not bind `127.0.0.1` (`EPERM`); the
  unrestricted rerun passed without a code change.
- No provider command or remote mutation was executed during review.

## Verdict and transition

**Verdict: `APPROVED`**

No blocking findings are active. A later approved slice exists in the
authoritative design: `railway-github-autodeploy`. Transition to
`human_gate / next_slice_approval`. Explicit owner approval is required before
the next slice begins. That approval does not waive the authoritative design's
separate requirement for a narrow verifier-credential amendment, immutable
design review, and explicit design approval before verifier implementation or
production activation.
