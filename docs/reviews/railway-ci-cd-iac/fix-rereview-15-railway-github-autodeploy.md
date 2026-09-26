# Fix Re-Review 15 — Railway GitHub autodeploy

## Review metadata

- **Work item:** `railway-ci-cd-iac`
- **Type:** `infrastructure`
- **Slice:** `railway-github-autodeploy`
- **Owning review:**
  `docs/reviews/railway-ci-cd-iac/implementation-review-14-railway-github-autodeploy.md`
- **Active findings reviewed:** `HIGH-04`, `MEDIUM-03`
- **Current HEAD SHA:** `ba9b03c6ac649851d52bb7b8bf81161a5b76c36b`
- **Date:** 2026-09-26
- **Artifact identifier:** `fix-rereview-15-railway-github-autodeploy`
- **Verdict:** `APPROVED`

## Preflight and scope

`PREFLIGHT PASSED`. The workflow state parses, routes canonically to
`fix_rereview`, has no gate, identifies the fixed
`railway-github-autodeploy` slice, keeps exactly `HIGH-04` and `MEDIUM-03`
active pending verification, and references the approved design, amendments,
owning immutable review, and context artifacts. The authoritative design
contains the later approved `end-to-end-cicd-acceptance` slice, so the current
slice is not final.

This re-review verifies only `HIGH-04`, `MEDIUM-03`, and direct regressions
from their fixes. It does not reopen the accepted verifier, bootstrap,
credential, provider-state, health, or earlier review findings. It does not
authorize an IaC apply, provider mutation, acceptance commit, push, migration,
deployment, or the later slice.

## Finding disposition

### HIGH-04 — FIXED

`.railway/railway.ts` now uses the pinned Railway IaC SDK's `github()` source
helper for repository `olegkirienko/guitar-mastering`, branch `main`, and
`checkSuites: true`. The edit leaves the named partial, service identity,
build command, `pnpm release:predeploy`, start command, health check, retry
cap, and preserved variables unchanged; it does not attempt to manage the
separate autodeploy toggle or another resource.

An authenticated read-only Railway CLI 5.57.7 re-review under Node 24.7.0
confirmed linked project `112644ba-cb91-443b-ae4b-73a0d6f74b69`, production
environment `994fd373-dd1d-4073-8b7f-116e77d898fa`, and web service
`4d0a3739-0beb-4ea9-9a7e-7a9f3494708e`. The live service source remains
`olegkirienko/guitar-mastering`, the prior successful deployment remains
active and running, and the topology remains unchanged. A fresh
`railway config plan --file .railway/railway.ts` returned:

`Your Railway configuration is already up to date.`

The plan proposed no removal or mutation of source, branch, Wait for CI,
variables, commands, service identity, topology, or any unrelated production
setting. No apply or other Railway mutation followed. This satisfies the
owning review's exact IaC parity requirement.

### MEDIUM-03 — FIXED

The authoritative design and operator record now state plainly that the
approved independent first-link proof was not obtained. They preserve the
immutable failed-rehearsal result and do not reinterpret it as successful
evidence or claim that the original entry criterion was satisfied.

The current audit trail identifies the later owner action as an explicit
one-time deviation. It records that the exact-SHA pre-deploy verifier and its
positive and fail-closed behavior were already active; source was staged on
the fixed production service and committed without redeploy; no source-link
deployment was created; Wait for CI and autodeploy were enabled only after
that observed no-deployment result; and post-link read-only verification
covered source, branch, Wait for CI, autodeploy, unchanged deployment history,
production health, and smoke. It also states that the deviation is neither a
retroactive design amendment nor a reusable proof procedure.

Former blocked/unset statements are retained only in dated historical
execution records and are superseded by the explicit current status and
reconciliation. The final acceptance slice remains responsible for positive
and negative end-to-end proof. These changes satisfy the owning review's audit
reconciliation requirement without introducing a direct regression.

## Validation

- Node `24.7.0` `pnpm lint` — passed.
- `pnpm test` — 13 files passed, 3 skipped; 73 tests passed, 19 skipped.
- `pnpm test:browser` — 10 passed.
- `pnpm test:postgres` — 3 files and 19 tests passed.
- `pnpm build` — passed for the Vite client and Node server.
- Workflow YAML parsing, artifact existence, routing, slice, review, and
  active-finding assertions — passed.
- Fresh authenticated Railway IaC plan — passed with no changes.
- `.railway/railway.ts` SHA-256:
  `b92e01c561d6517a6e15737506b77bcc6b5aa3c6a1a12e75511dbd624b3ab3e7`.
- `git diff --check` — passed before this review artifact/state transition.
- Railway activity in this re-review was read-only. No provider mutation,
  GitHub mutation, commit, push, migration, or deployment was performed.

## Verdict and transition

**Verdict: `APPROVED`**

`HIGH-04` and `MEDIUM-03` are closed. A later approved slice exists in the
authoritative design: `end-to-end-cicd-acceptance`. Transition to
`human_gate / next_slice_approval`. Explicit approval of that newly current
gate is required before the acceptance slice may begin; the request that
initiated this `fix_rereview` phase cannot be consumed prospectively as gate
approval.
