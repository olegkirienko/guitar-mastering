# Implementation Review 14 — Railway GitHub autodeploy

## Review metadata

- **Work item:** `railway-ci-cd-iac`
- **Type:** `infrastructure`
- **Slice:** `railway-github-autodeploy`
- **Authoritative design:** `docs/technical-designs/railway-ci-cd-iac.md`
- **Implementation evidence:**
  `docs/operations/railway-github-autodeploy-plan.md`
- **Base HEAD reviewed:** `ba9b03c6ac649851d52bb7b8bf81161a5b76c36b`
- **Date:** 2026-09-26
- **Verdict:** `CHANGES REQUIRED`

## Preflight and scope

`PREFLIGHT PASSED`. The workflow state parses, identifies the approved
infrastructure design and amendments, routes canonically to
`implementation_review`, names the implemented `railway-github-autodeploy`
slice, has no gate or active finding, and references artifacts that exist. The
authoritative design contains one later approved slice,
`end-to-end-cicd-acceptance`; this is not the final slice.

This review covers the exact-SHA verifier, its tests and build integration, the
production-image guard bootstrap, credential and IaC handling, first-link
evidence, effective GitHub source/Wait for CI/autodeploy configuration,
deployment history, health, documentation, design compliance, and drift. It
does not authorize an acceptance commit, the final slice, an IaC apply, a
provider mutation, a migration, or a new deployment.

## Accepted implementation

The repository verifier is fail closed and conforms to the approved credential
amendment. It requires the literal true gate, a full Railway Git SHA, and the
sealed token; it pins repository and workflow identities; accepts only an
initial successful `push` run on `main`; requires exactly one successful
`validate` job and every named CI step; rejects pagination uncertainty,
malformed responses, low rate-limit headroom, authentication and API failures;
and bounds timeouts and retries. `release:predeploy` executes it before the
migration. Focused tests cover the relevant positive, negative, malformed,
pagination, rate-limit, and retry paths.

The production bootstrap evidence is coherent. The reviewed image was deployed
under the old migration command, the compiled verifier and package script were
proved image-local, the credential was installed sealed, and the pre-deploy
command was activated first with the explicit false bootstrap gate. Image-local
positive and impossible-SHA negative verifier checks behaved as designed. The
later true-gate CLI deployment failed on absent Railway Git metadata before any
migration output, while deployment
`461b23f8-9b06-4033-b225-f46571b5d350` remained active and successful.

Read-only Railway CLI 5.57.7 and live GraphQL verification during this review
confirmed the fixed project, production environment, and web-service scope;
repository `olegkirienko/guitar-mastering`; branch `main`; trigger
`37dfea95-f342-49fa-af20-08dfbb9d3607`; `checkSuites: true`; one valid check
suite; autodeploy enabled; empty watch paths; effective
`pnpm release:predeploy`; `ON_FAILURE` with three retries; failed latest guard
deployment `56a63457-6062-4083-8c06-d2422e4ea45e`; and the prior successful
deployment still running. The repository production smoke passed health and
readiness with 200, the unknown API boundary with 404, and the SPA root with
200.

## Blocking findings

### HIGH-04 — IaC would remove the effective GitHub source and Wait for CI

The effective production service now has GitHub source
`olegkirienko/guitar-mastering`, branch `main`, and `checkSuites: true`, but
`.railway/railway.ts` still declares no source for its owned web service. A
fresh Node 24.7.0 `railway config plan --file .railway/railway.ts` therefore
reported `0 to add, 1 to change, 0 to destroy` and proposed:

- `source.checkSuites: true -> null`;
- `source.repo: "olegkirienko/guitar-mastering" -> null`; and
- `source.type: "github" -> null`.

This contradicts the slice's claimed completed, drift-safe state and the
design's manual plan/apply procedure. A future reviewed IaC apply from the
current repository would disconnect the release source and disable Wait for CI,
breaking the central CI/CD invariant.

Targeted fix: change only the Railway IaC source declaration and directly
related durable evidence/state. Represent the already-effective GitHub source,
`main` branch, and Wait for CI setting with the repository's pinned Railway IaC
SDK, without changing topology, variables, pre-deploy behavior, autodeploy, or
any other service property. Under Node 24.7.0, require a fresh production plan
to show no source change and no unexpected add/change/destroy. Do not run
`railway config apply`; the target state is already effective. Correct any
claim that the post-link IaC plan is clean unless that clean plan is actually
captured.

### MEDIUM-03 — The durable record does not reconcile the first-link design deviation

The approved design makes successful read-only first-link proof a hard entry
criterion. It says that if safe ordering cannot be proved, the slice must stop
for a design amendment and must not select the production repository. The
isolated rehearsal then failed before connection with `User does not have
access to the repo`; its immutable evidence correctly says it did not prove a
safe production sequence and that no production source action was authorized.
The workflow state likewise recorded a design amendment as the next allowed
action.

The later operator record instead introduces an owner-directed production
checklist and records that production source, Wait for CI, and autodeploy became
effective. The observed outcome was safe—no source-link deployment appeared,
the guard remained effective, and the prior deployment stayed healthy—but no
intervening amendment/review artifact established the precondition required by
the approved design. The operator plan still says source connection is blocked
until independent proof and separate review, yet does not explicitly identify
the later production action as a deviation from that requirement. This leaves
the authoritative audit trail internally misleading.

Targeted fix: documentation and workflow state only. Preserve the immutable
failed-rehearsal evidence and do not invent retroactive proof or approval.
Update the current design status/operator evidence to state plainly that the
owner-directed production checklist was a one-time deviation from the approved
pre-link proof path, record the already-observed safe outcome and remaining
invariants, and reconcile obsolete statements that still say production source
is blocked or unset. Make no application, CI, credential, IaC behavior,
GitHub, or Railway provider change for this finding.

## Validation

- Node `24.7.0` `pnpm lint` — passed.
- `pnpm test` — passed unrestricted: 73 passed, 19 skipped.
- `pnpm test:browser` — passed: 10 passed.
- `pnpm test:postgres` — passed: 19 passed.
- `pnpm build` — passed.
- `git diff --check` — passed before this review artifact/state transition.
- The initial sandboxed unit run could not bind `127.0.0.1` (`EPERM`); the
  unrestricted rerun passed without a code change.
- Production smoke — passed: health 200, readiness 200, unknown API 404, root
  200.
- Live source/trigger/autodeploy/deployment read-back — passed and matched the
  operator evidence.
- Railway IaC drift plan — failed the required no-change expectation with the
  source-removal plan captured in `HIGH-04`.
- Review activity was read-only against Railway; no provider mutation, GitHub
  mutation, commit, push, migration, or deployment was performed.

## Verdict and transition

**Verdict: `CHANGES REQUIRED`**

Route to `fixes` with only `HIGH-04` and `MEDIUM-03` active. The verifier,
bootstrap, effective provider configuration, and health result are otherwise
accepted. Targeted fixes must remain limited to the Railway IaC source parity
and audit-record reconciliation described above. After fixes, run
`fix_rereview` against these two findings only. The later
`end-to-end-cicd-acceptance` slice remains unauthorized.
