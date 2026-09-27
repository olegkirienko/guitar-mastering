# Implementation Review 16 — End-to-end CI/CD acceptance

## Review metadata

- **Work item:** `railway-ci-cd-iac`
- **Type:** `infrastructure`
- **Slice:** `end-to-end-cicd-acceptance`
- **Authoritative design:** `docs/technical-designs/railway-ci-cd-iac.md`
- **Implementation evidence:**
  `docs/operations/railway-end-to-end-cicd-acceptance-evidence-2026-09-26.md`
- **Retirement plan:**
  `docs/operations/railway-deployment-version-retirement-plan.md`
- **Base HEAD reviewed:** `398ef93595f92196fc522edf0e9fec32c4931e83`
- **Date:** 2026-09-27
- **Artifact identifier:** `implementation-review-16-end-to-end-cicd-acceptance`
- **Verdict:** `CHANGES REQUIRED`

## Preflight and scope

`PREFLIGHT PASSED`. The workflow state parses, identifies the approved
infrastructure design and amendments, routes canonically to
`implementation_review`, names the implemented `end-to-end-cicd-acceptance`
slice, has no gate or active finding, and references artifacts that exist. The
authoritative design contains no later approved slice, so this is the final
slice and an eventual approval must route to
`human_gate / work_item_completion`.

This review covers the positive protected-branch release, the production
failure-path test, recovery, exact-SHA correlation, verifier-before-migration
ordering, production smoke and metrics, static version-variable retirement,
IaC drift, runbook synchronization, scope discipline, and repository
validation. Review activity against GitHub and Railway was read-only.

## Accepted implementation

The positive, negative, and recovery acceptance evidence satisfies the central
release invariant. The protected `main` path produced distinct successful
push-event validation for the positive and recovery SHAs. The negative SHA
failed only in the reviewed final fixture after all ordinary validation steps
passed; Railway recorded the exact SHA as `SKIPPED` with reason
`CI check suite failed`, no build artifact, and no pre-deploy, migration, or
promotion. The prior healthy release remained active through that failure.

The final retirement release is also technically sound. GitHub run
`36247805042` passed for merge SHA
`398ef93595f92196fc522edf0e9fec32c4931e83`. Railway deployment
`2ad9e615-2f2e-458d-8e95-932c7ef2b6e4` is successful for that same SHA. Its
logs place verifier success before migration, then record the same full SHA in
`server_started` and readiness. Bounded production smoke recorded health 200,
readiness 200, the unknown API boundary 404, and the SPA root 200. The current
Railway IaC plan is a clean no-op, and no application fallback code was
removed.

Read-only re-verification confirmed the active main ruleset remains strict,
requires pull requests and `validate`, prevents deletion and non-fast-forward
updates, has no bypass actor, and reports that the current user cannot bypass
it. The latest production deployment and the historical skipped deployment
match the recorded IDs, SHAs, statuses, commands, retry policy, and image
metadata.

## Blocking finding

### MEDIUM-04 — The acceptance plan contradicts the destructive action it records as completed

The authoritative acceptance plan says the static production variable may be
retired only by an exact reviewed **no-add/no-destroy** plan. Deleting
`DEPLOYMENT_VERSION` necessarily appeared to Railway as one destroy, and the
separate retirement plan correctly required and recorded
`0 add / 0 change / 1 destroy`, explicit owner approval of that exact deletion,
and application of the pinned plan.

The action itself was narrowly scoped, explicitly approved, and successfully
verified, so this is not a finding against the production result. It is a
control-record contradiction: the durable top-level operator plan currently
states that the applied plan was forbidden. Leaving both claims in force makes
it impossible for a later operator or completion audit to determine which
authorization boundary governed the action.

Targeted fix: documentation and workflow state only. Reconcile the acceptance
plan's retirement instruction with the separately reviewed retirement plan and
the immutable execution evidence. State that the only permitted destroy was
the explicitly approved deletion of production `DEPLOYMENT_VERSION`, with zero
adds, zero changes, and no other destroys, and make clear that this correction
records the actual reviewed authorization rather than granting new permission.
Do not alter application code, IaC, GitHub settings, Railway state, variables,
deployments, or immutable review artifacts.

## Validation

- Node `24.7.0` `pnpm lint` — passed.
- `pnpm test` — passed unrestricted: 73 passed, 19 skipped.
- `pnpm test:browser` — passed: 10 passed.
- `pnpm test:postgres` — passed: 19 passed.
- `pnpm build` — passed.
- `git diff --check` — passed before this review artifact/state transition.
- The initial sandboxed unit run could not bind `127.0.0.1` (`EPERM`); the
  unrestricted rerun passed without a code change.
- GitHub negative run, final push run, and active ruleset read-back — passed and
  matched the execution evidence.
- Railway deployment history and final-deployment logs — passed and matched the
  recorded skipped/final states, exact SHAs, verifier ordering, migration, and
  smoke results.
- Fresh Railway CLI 5.57.7 IaC plan under Node 24.7.0 — clean no-op.
- Review activity performed no provider mutation, GitHub mutation, apply,
  variable change, migration, deployment, commit, or push.

## Verdict and transition

**Verdict: `CHANGES REQUIRED`**

Route to `fixes` with only `MEDIUM-04` active. The acceptance behavior,
production failure-path proof, recovery, exact-SHA guard, retirement result,
runtime health, and clean IaC state are otherwise accepted and must remain
unchanged. After the documentation-only fix, run `fix_rereview` against
`MEDIUM-04` only. Because this is the final approved slice, a later approved
re-review must route to `human_gate / work_item_completion`, not invent a next
slice or complete the work item automatically.
