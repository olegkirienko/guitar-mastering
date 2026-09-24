# GitHub CI/CD and Railway operations

## Current boundary

`Validate` runs for pull requests and every push to `main`. The `main` ruleset
requires the strict `validate` context. GitHub Actions is validation-only: it
does not deploy, run production migrations, or apply Railway infrastructure.

The production Railway web service is still on the existing manual release
path. This runbook does not authorize connecting its GitHub source, enabling
Wait for CI or autodeploy, creating a verifier credential, changing production
variables, or applying infrastructure. Those actions remain gated by the
`railway-ci-cd-iac` workflow and their approved operator plans.

The exact-SHA verifier is implemented in `server/verify-ci.ts`. When
`GITHUB_CI_GATE_REQUIRED=true`, it requires a full Railway Git SHA and sealed
`GITHUB_ACTIONS_READ_TOKEN`; anonymous fallback is forbidden. It accepts only
the pinned `Validate` push run for that SHA, its single successful `validate`
job, and every required successful validation step. Missing credentials,
pagination uncertainty, malformed responses, redirects, timeouts, API errors,
or insufficient authenticated core-rate-limit headroom fail before migration.
The literal `false` value is reserved for the reviewed production bootstrap;
missing or any other value fails closed.

Production identity references must be re-read before every remote action:

- project `112644ba-cb91-443b-ae4b-73a0d6f74b69`;
- environment `994fd373-dd1d-4073-8b7f-116e77d898fa`;
- web service `4d0a3739-0beb-4ea9-9a7e-7a9f3494708e`;
- PostgreSQL service `82d4b5e1-830a-4467-bb1f-f9448fd1d58d`;
- domain `1cff255c-4eea-493e-9c82-7d2ba1672046`;
- database volume `4495ab33-2440-4d29-a4d4-e214813676a8`;
- PITR bucket `06fb8382-c35f-43be-b127-3fb98c30f3b0`.

These IDs are historical guardrails, not instructions to recreate resources.
An unexpected identity, add/delete, source link, or topology change is a stop
condition.

## Canonical release path

The approved target sequence is:

1. Open a pull request and let its unconditional `Validate` run succeed.
2. Merge through the protected `main` branch without a CI skip directive.
3. Require the separate `push`-event `Validate` run for the resulting full
   `main` SHA.
4. After the later autodeploy slice is approved and activated, Railway waits
   for CI, builds that SHA, and runs the exact-SHA verifier before migration.
5. A successful verifier permits `pnpm db:migrate`; readiness must pass before
   promotion, followed by production smoke and observation.

Until step 4 is explicitly activated, use the existing reviewed manual release
procedure in [production-cutover.md](production-cutover.md). Do not treat this
target sequence as evidence that GitHub source or autodeploy is active.

## Commit-SHA correlation

For a GitHub-triggered deployment, the server prefers Railway's built-in
`RAILWAY_GIT_COMMIT_SHA` and writes the full 40-character value as
`deploymentVersion` in `server_started` and `request_completed` structured
logs. Health and readiness response bodies intentionally do not expose it.

For the current manual deployment path and local/test fixtures,
`DEPLOYMENT_VERSION` remains the required fallback. Preserve that production
variable until a successful GitHub-triggered acceptance release proves the
same full SHA across:

- the merged `main` commit;
- the `push`-event `Validate` run and its `head_sha`;
- Railway deployment metadata;
- application structured logs.

Missing Git metadata uses the fallback. Malformed nonempty
`RAILWAY_GIT_COMMIT_SHA` fails startup instead of recording ambiguous release
identity. Removing the production fallback is a separately reviewed action in
the end-to-end acceptance slice.

## Manual Railway IaC and drift

Infrastructure configuration is intentionally separate from application
autodeploy. Use Node `24.7.0`, the pinned repository dependencies, the exact
production project/environment, and `.railway/railway.ts`.

1. Read back live service identity, topology, source state, effective deploy
   settings, variable names/references, domain, PostgreSQL, volume, PITR,
   active deployment, readiness, and smoke. Never print secret values.
2. Run a production `railway config plan --file .railway/railway.ts` and save
   the reviewable output. The normal drift baseline is no changes. The known
   restart-policy exception is acceptable only when the plan is otherwise
   clean and live read-back proves `ON_FAILURE` with three retries.
3. If the plan proposes an add/delete, identity/topology/source change, secret
   disclosure, or any unreviewed field, stop. Reconcile the cause and obtain a
   new review; do not apply speculatively.
4. Apply only an explicitly reviewed plan in a controlled window. Immediately
   read back effective state, run a fresh plan, verify deployment health and
   production smoke, and record the operator, UTC time, plan, apply result,
   resource IDs, and any deployment created by the action.

Never automate IaC apply from `Validate`, and never assume an application push
has applied `.railway/railway.ts`.

## Failure diagnosis

### CI failure or timeout

Keep the prior healthy deployment serving. Match the full SHA to the expected
`push` run and inspect every required step. Failed, missing, skipped, neutral,
cancelled, timed-out, manually dispatched, or different-SHA evidence is not an
accepted release. Fix forward through a new pull request; do not rerun a manual
workflow as release proof or weaken the branch rules.

If the exact-SHA verifier fails, preserve its nonsecret diagnostic and the
workflow run/job IDs when present. Never print the authorization header or
credential while diagnosing. A `401`, `403`, or `429` is not retried and must
not trigger anonymous access. A transient network failure or GitHub `5xx` may
receive only the verifier's single bounded retry.

### Migration or pre-deploy failure

Confirm the failed deployment SHA and that no new version was promoted. Inspect
the pre-deploy ordering and logs without exposing credentials. A migration may
have partially changed the database, so assess transactionality and schema
compatibility before retrying. Fix forward; do not automatically migrate down.
Keep the prior application only if it remains compatible with the resulting
schema.

### Readiness or startup failure

Confirm the previous healthy deployment still serves traffic. Inspect startup
logs, readiness database access, deployment settings, and metrics. A passing
deployment healthcheck is promotion evidence, not continuous monitoring, so
run the production smoke command and continue observation after recovery.

### SHA mismatch

Stop promotion or acceptance if GitHub, Railway metadata, and structured logs
do not identify the same full SHA. Do not overwrite metadata or fall back to a
short SHA to make evidence match. Keep autodeploy disabled, preserve the
relevant run/deployment URLs and UTC timestamps, and return to design review if
the provider path cannot supply trustworthy metadata.

## Rollback and evidence

For an application regression, select the prior migration-compatible Railway
deployment; do not reverse schema automatically. Record both deployment IDs,
full SHAs, migration outcomes, readiness/smoke results, and the restored
structured-log version. Database recovery follows the isolated PITR procedure
in [production-cutover.md](production-cutover.md) and requires a separate
reviewed connection change.

Every release or recovery record should include the PR, merge SHA, push-run
URL and conclusion, Railway deployment ID/status, pre-deploy and migration
outcomes, readiness/smoke results, relevant metrics, resource identity
read-back, UTC timestamps, and redacted IaC plan/read-back where applicable.
