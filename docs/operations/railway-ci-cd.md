# GitHub CI/CD and Railway operations

## Current boundary

`Validate` runs for pull requests and every push to `main`. The `main` ruleset
requires the strict `validate` context. GitHub Actions is validation-only: it
does not deploy, run production migrations, or apply Railway infrastructure.

The production Railway web service is connected to
`olegkirienko/guitar-mastering` branch `main`, with Wait for CI and autodeploy
enabled. Application releases now follow the protected GitHub path below.
Provider configuration changes and Railway IaC applies remain separately
reviewed operations; an application push does not apply `.railway/railway.ts`.

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
4. Railway waits for CI, builds that SHA, and runs the exact-SHA verifier before
   migration.
5. A successful verifier permits `pnpm db:migrate`; readiness must pass before
   promotion, followed by production smoke and observation.

The first positive and protected-branch negative production proofs passed on
2026-09-26; their plan and evidence are in git history. Do not use a manual CLI
deployment as a substitute for this release path.

## Commit-SHA correlation

For a GitHub-triggered deployment, the server prefers Railway's built-in
`RAILWAY_GIT_COMMIT_SHA` and writes the full 40-character value as
`deploymentVersion` in `server_started` and `request_completed` structured
logs. Health and readiness response bodies intentionally do not expose it.

For earlier CLI-built rollback images and local/test fixtures,
`DEPLOYMENT_VERSION` remains the application fallback. Production retired the
static variable after successful GitHub-triggered acceptance proved the same
full SHA across:

- the merged `main` commit;
- the `push`-event `Validate` run and its `head_sha`;
- Railway deployment metadata;
- application structured logs.

Missing Git metadata uses the fallback when one is supplied. Malformed nonempty
`RAILWAY_GIT_COMMIT_SHA` fails startup instead of recording ambiguous release
identity. The production retirement and its post-deletion verification are recorded in
git history.

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

GitHub can briefly serve incomplete job-step data for a completed, successful
run. On 2026-09-30 it did so for more than 131 s after CI completed. When a
required step is missing or has a `null` conclusion, the verifier re-reads the
same run's jobs:

- at most 5 reads, at 0, 15, 45, 105, and 225 s;
- with the validate job ID pinned from the first read;
- with one log line per re-read, recording the observed state.

Each read must prove all six steps on its own. Skipped, failed, cancelled, or
duplicated steps fail at once. The budget is at most 12 HTTP requests and about
305 s of extra time, and only while data is incomplete. When the data never
completes, the error names the step and `after 5 job reads`.

In that case, retry the deployment only after the owner approves the exact
redeploy operation, as described in the `delivery-verification` skill. Never
retry by editing variables or bypassing the verifier. Before the retry,
`corepack pnpm delivery:retry-guard --mode pre --sha <merged SHA>` must clear:
`main` and the newest web deployment are both at that SHA, and the deployment
is `FAILED` or `CRASHED`. After the retry, `--mode post` must confirm that no
newer deployment or merge replaced it. A stop after the retry blocks delivery
verification for the owner.

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
