# Railway IaC parity foundation: production handoff plan

**Work item:** `railway-ci-cd-iac`  
**Slice:** `railway-iac-parity-foundation`  
**Prepared:** 2026-09-20  
**Status:** the amended parity check and repository validation passed on 2026-09-20 after explicit design approval. The legacy `railway.json` was removed from the repository; no second IaC apply or production mutation was performed. The slice is ready for implementation review.

## Target and read-only baseline

Railway CLI 5.57.7 is authenticated to the existing project. The IaC file is
restricted to project `112644ba-cb91-443b-ae4b-73a0d6f74b69` and production
environment `994fd373-dd1d-4073-8b7f-116e77d898fa`. Its named partial owns
only the existing web service `4d0a3739-0beb-4ea9-9a7e-7a9f3494708e`
(`guitar-mastering-web-production`). The service has no GitHub source. Its
currently successful deployment is `11a3dc0e-0092-4b61-8643-61cb30da5e3a`.

The existing domain is
`guitar-mastering-web-production-production.up.railway.app` (domain ID
`1cff255c-4eea-493e-9c82-7d2ba1672046`). PostgreSQL is service
`82d4b5e1-830a-4467-bb1f-f9448fd1d58d`, with successful deployment
`4187bbb4-bc5d-44fb-92da-b40e68022e01`. Volume
`4495ab33-2440-4d29-a4d4-e214813676a8` is `READY` and mounted at
`/var/lib/postgresql/data`. PITR bucket
`06fb8382-c35f-43be-b127-3fb98c30f3b0` is wired; Railway reported PITR
enabled, live backup available, and archiver healthy. Recheck each identity and
health immediately before mutation; these IDs are evidence, not creation targets.

The current production web configuration and latest deployment establish:

| Behavior | Current `railway.json` value | IaC intent |
| --- | --- | --- |
| Build | `pnpm install --frozen-lockfile && pnpm build` | Same |
| Pre-deploy | `pnpm db:migrate` | Same |
| Start | `pnpm start` | Same |
| Readiness | `/api/v1/readiness` | Same |
| Timeout | 120 seconds | Same |
| Restart | `ON_FAILURE`, maximum 3 retries | Same |

The environment configuration does not store the build command or restart type;
the last successful deployment records both via its legacy Config File mapping.
The service instance's explicit `railwayConfigFile` path is currently `null`,
so the legacy file was found by the default lookup rather than a custom path.
That older deployment used `pnpm install --frozen-lockfile && pnpm build:railway`
for its build. The current repository's `railway.json` instead specifies
`pnpm install --frozen-lockfile && pnpm build`; this is the approved design's
required value and passed local build validation. It will be a real command
change compared with the old deployed image on the next build. The read-only
IaC plan shows two transfers from the stored environment's `null` values:
`build.buildCommand` and `deploy.restartPolicyType`.
It reports **0 add, 2 change, 0 destroy**. No other resource or setting appears.
This is the expected initial handoff plan, not a claim that `config apply` is a
no-op.

The web variables are preserved by name in the IaC file without values:
`APP_ENV`, `ARGON2_MAX_ACTIVE`, `ARGON2_MAX_QUEUE`, `DATABASE_URL`,
`DEPLOYMENT_VERSION`, `NODE_ENV`, `PG_CONNECTION_TIMEOUT_MS`, `PG_POOL_MAX`,
`PG_STATEMENT_TIMEOUT_MS`, `PG_TRANSACTION_TIMEOUT_MS`, `PUBLIC_ORIGIN`,
`RATE_LIMIT_HMAC_KEY`, `SECURE_COOKIES`, `SHUTDOWN_TIMEOUT_MS`, and
`TRUSTED_PROXY_HOPS`. `DATABASE_URL` is a reference to the existing private
PostgreSQL service. The PostgreSQL private endpoint is `postgres-dov` and no
public PostgreSQL domain appeared in the production configuration. No values
were printed or placed in this file.

The repository's production smoke check passed: health 200, readiness 200,
unknown API route 404, and root 200. Railway's dry-run `config migrate --service
guitar-mastering-web-production` generated a named partial for the correct web
service. The reviewed `.railway/railway.ts` adds the omitted restart fields,
pins the project/environment IDs, and preserves variable names. The named
partial leaves the PostgreSQL service, volume, PITR bucket, and generated domain
outside its ownership.

## Controlled handoff after explicit operator approval

1. Freeze production deployments and IaC changes. Recheck target IDs, current
   active deployment, source absence, six effective behaviors, domain, private
   database reference, volume, PITR, variable names, and smoke. Save a redacted
   effective configuration, `railwayConfigFile: null`, and the current
   `railway.json` as the restore record.
   Stop if any baseline differs materially.
2. Save the reviewed `.railway/railway.ts` locally. Run `railway config migrate
   --apply --force --service guitar-mastering-web-production` **without**
   `--delete-files`. This writes the importer output and clears the production
   web service's Config File association. Compare the generated output with the
   recorded dry run, then restore the reviewed IaC file before planning. Stop
   and restore the old Config File association if the importer targets anything
   else or the association cannot be read back. Keep `railway.json` in place.
3. Run a fresh production `railway config plan` against the restored reviewed
   file, with values redacted. Continue only if it shows the two expected web
   setting transfers and **0 add, 0 destroy**, with no variable or resource
   changes. A changed or stale plan requires renewed review. Capture the exact
   plan and source tree for the apply.
4. Apply only that reviewed plan to the exact production environment. Read back
   the six settings, no GitHub source, domain, private database reference,
   PostgreSQL/volume/PITR identities and health, variable names, deployment
   history, and production smoke. Run a fresh follow-up plan and require no
   drift before removing the legacy file.
5. Remove `railway.json` from the repository only after the read-back and clean
   plan prove parity. Confirm future deployments use the IaC-managed settings.
   Do not connect a GitHub source or enable autodeploy in this slice.

**Stop and restore:** Any unexpected add/delete, variable change, topology
change, lost command, failed deployment, unhealthy database/PITR, or failed
smoke stops the handoff. Restore the saved default Config File lookup
(`railwayConfigFile: null`) if it was cleared, retain the current healthy
deployment, and gather deployment and plan evidence before retrying. Never run
an unreviewed `config apply` or
remove `railway.json` while parity is unproved.

## Production execution evidence — 2026-09-20

The owner explicitly approved this operator plan and its 0-add/2-web-setting/
0-delete scope. Railway CLI 5.57.7 ran under Node 24.7.0 against project
`112644ba-cb91-443b-ae4b-73a0d6f74b69`, production environment
`994fd373-dd1d-4073-8b7f-116e77d898fa`. The pre-handoff and post-handoff
plans each contained exactly `build.buildCommand (null → "pnpm install
--frozen-lockfile && pnpm build")` and `deploy.restartPolicyType (null →
"ON_FAILURE")` on service `4d0a3739-0beb-4ea9-9a7e-7a9f3494708e`, with no
additions, deletions, variables, or other resource changes. The reviewed IaC
source SHA-256 was `d1b4e499229c3295f77b883308c18e9eaa6fef45b95375ef3ef917b6fd2b4bc6`;
the retained `railway.json` SHA-256 was
`6f9aaeb0803dd8050ba8a0648eea8b800d683eacf328759aa1bfdeb0c0cf1dc1`.

Before mutation, the web and PostgreSQL deployments were `SUCCESS`, production
smoke passed, volume `4495ab33-2440-4d29-a4d4-e214813676a8` was `READY`, and
PITR bucket `06fb8382-c35f-43be-b127-3fb98c30f3b0` was enabled, wired, live,
and archiver-healthy. The domain remained
`1cff255c-4eea-493e-9c82-7d2ba1672046`; no GitHub source was connected.
The 15 user variable names matched IaC `preserve()` entries, and the unrendered
`DATABASE_URL` remained a PostgreSQL service reference resolving to a private
Railway host. No variable values were recorded.

`railway config migrate --apply --force --service
guitar-mastering-web-production` wrote the expected named partial and reported
clearing only that service's Config File setting, without `--delete-files`.
The reviewed IaC file was restored byte-for-byte before the fresh saved plan.
Railway read back `railwayConfigFile: null`, the same value as before the handoff.
The exact saved 0/2/0 plan was applied after matching its environment, etag,
source-tree identity, and two change summaries. Railway returned `applied` for
the existing web service and change-set ID
`iac-change-set/994fd373-dd1d-4073-8b7f-116e77d898fa/0311683f9c448ded465b19f2b3748ac9`.
Two earlier saved-plan attempts were rejected by Railway's source-tree check
before mutation because the caller supplied an incomplete hash; the accepted
plan used the CLI's `sha256:`-prefixed merged-tree identity.

The apply triggered web deployment `e0e98aab-e244-4151-8622-3e88a6d4f9ed`,
which reached `SUCCESS` and became the running deployment. Its manifest shows
the approved build, pre-deploy, start, readiness path/timeout, and restart
policy (`ON_FAILURE`, three retries). After promotion, health and readiness
returned 200, unknown API route 404, and SPA root 200. Readiness runs a
PostgreSQL `SELECT 1` probe. PostgreSQL deployment
`4187bbb4-bc5d-44fb-92da-b40e68022e01` remained running, the volume/domain/
PITR bucket identities were unchanged, and PITR remained enabled, wired, live,
and archiver-healthy.

**Blocking parity result:** A fresh `railway config plan` after the successful
deployment still reports one pending update on the same web service:
`deploy.restartPolicyType (null → "ON_FAILURE")`. Its current graph omits the
stored restart type, although the active deployment manifest reports
`ON_FAILURE`. The required clean/no-op plan was therefore **not** achieved.
No second IaC apply was attempted. `railway.json` remains in the repository;
the Config File path is still `null`, matching the saved default-lookup
baseline. The work item remains in `implementation / in_progress`. Full
repository validation and transition to `implementation_review` await a
reviewed resolution and a clean plan.

## Restart-policy parity diagnosis — 2026-09-20

This investigation was read-only. It used Railway CLI 5.57.7, TypeScript SDK
`railway` 3.11.0, the Railway service-config MCP read, and the public GraphQL
API. The target remained project `112644ba-cb91-443b-ae4b-73a0d6f74b69`,
production environment `994fd373-dd1d-4073-8b7f-116e77d898fa`, and web
service `4d0a3739-0beb-4ea9-9a7e-7a9f3494708e`.

| Source | Restart type | Maximum retries |
| --- | --- | --- |
| `.railway/railway.ts` desired state | `ON_FAILURE` | 3 |
| Fresh `railway config plan --json` current graph | absent (`null` in diff) | 3 |
| Fresh `railway config pull --json --omit-preserved-variables` | absent | 3 |
| `railway environment config --json` raw service deploy config | absent | 3 |
| Railway service-config MCP read | absent | 3 |
| GraphQL `ServiceInstance.restartPolicyType` / `restartPolicyMaxRetries` | `ON_FAILURE` | 3 |
| Active successful deployment `e0e98aab-e244-4151-8622-3e88a6d4f9ed` manifest | `ON_FAILURE` | 3 |

The fresh IaC plan still contains exactly one safe update,
`deploy.restartPolicyType (null → "ON_FAILURE")`, and no other change. The
service-instance API also reports `railwayConfigFile: ""`; the configuration
reads expose `configFile: ""`. These are empty association values, not an
explicit restart-policy value. The active deployment remains `SUCCESS`.

**Best-supported cause:** Railway's effective service/deployment view supplies
`ON_FAILURE` while the raw environment configuration used by IaC has no stored
`restartPolicyType`. Railway documents `On Failure` as the default. The
successful apply did not make an explicit restart type visible in a subsequent
raw config read, so the stateless IaC planner continues to compare an absent
current field with an explicit desired field. This is a reproducible
read/write/parity mismatch for this value on this service. The available
read-only evidence cannot distinguish whether the backend intentionally
normalizes an explicit default away or failed to persist that part of the
patch. No Railway documentation found states that `restartPolicyType` is
write-only or generally unsupported by IaC. It is not stale local state:
Railway describes IaC as stateless, and independent fresh reads agree. It is
not observed *effective* configuration drift: the service API and active
deployment both report `ON_FAILURE` with three retries.

The authoring field is valid. SDK 3.11.0's `DeployConfig` type includes
`restartPolicyType?: "ON_FAILURE" | "ALWAYS" | "NEVER" | null`, and its
`normalizeDeploy` function passes `config.deploy` into the graph. The fresh
plan's desired graph contains `ON_FAILURE`, confirming that the SDK and CLI
recognized the field. Railway's current IaC reference does not document a
different restart-policy DSL name.

**Recommended next action at diagnosis:** Treat the type as an
accepted-platform-exception candidate, subject to a design amendment and
normal design review. Do not edit the IaC file, apply another plan, remove
`railway.json`, or advance to implementation review until the exception is
reviewed and explicitly approved under the work-item workflow.

References: [Railway IaC guide](https://docs.railway.com/infrastructure-as-code),
[IaC authoring reference](https://docs.railway.com/infrastructure-as-code/reference),
[restart-policy default](https://docs.railway.com/deployments/restart-policy),
[SDK 3.11.0 normalization](https://github.com/railwayapp/railway-ts-sdk/blob/v3.11.0/src/iac/sdk.ts).

## Proposed parity-policy amendment — 2026-09-20

The authoritative design now proposes `restartPolicyType` as an explicit
Railway platform exception: the documented `ON_FAILURE` default is effective,
but the explicit value does not round-trip through current raw configuration
and IaC reads. Project parity requires a clean IaC plan for all supported
round-trippable fields **and** read-only/runtime verification of documented
exceptions. The immutable amendment record is
`docs/reviews/railway-ci-cd-iac/design-amendment-01-restart-policy-parity.md`.
This proposal is pending design review and explicit human approval.

After approval, the bounded implementation action is to remove only
`deploy.restartPolicyType` from `.railway/railway.ts`, retain
`deploy.restartPolicyMaxRetries: 3`, and obtain a fresh redacted plan against
the pinned production target. A clean plan establishes parity for supported
round-trippable fields. Check the effective `ServiceInstance` policy and the
active deployment manifest after any deployment; both must report type
`ON_FAILURE` and maximum retries `3`. Capture deployment ID, read time, and
redacted results. If the plan has any other change, or either effective check
fails or is unavailable, stop and keep `railway.json`. No second IaC apply is
part of this amendment or needed merely to omit the unround-trippable field.
The existing handoff/apply steps above are historical execution evidence and
are not instructions to repeat them.

Remove `railway.json` only after the amended parity proof and the existing
effective-setting, topology, health, and deployment checks pass in the
authorized implementation slice. If Railway later makes
`restartPolicyType` stable round-trippable state, restore explicit IaC
management only through a reviewed change.

## Amended parity execution evidence — 2026-09-20

The owner explicitly approved the amended design gate. The only change to
`.railway/railway.ts` was removal of `deploy.restartPolicyType`;
`deploy.restartPolicyMaxRetries: 3` remains. The amended IaC source SHA-256
is `167bee7ca624bc7272e914cbb8412f54492c30b2f9241e791d4fee4c52003a9b`.
By 2026-09-20T11:54:56Z, a fresh read-only Railway CLI 5.57.7 plan against
the pinned production project and environment returned an empty change set,
`No changes`, and no diagnostics. The current and desired graphs contain the
same preserved variable names, no GitHub source, the existing domain, and
private PostgreSQL endpoint `postgres-dov`. No IaC apply followed this plan.

The effective `ServiceInstance` reports `ON_FAILURE` and three retries. Its
only active deployment, `e0e98aab-e244-4151-8622-3e88a6d4f9ed`, is
`SUCCESS`; its deployment manifest independently reports `ON_FAILURE` and
three retries. Effective build, pre-deploy, start, readiness path, and timeout
match the approved values. Production HTTPS smoke passed: health 200,
readiness 200, unknown API route 404, and SPA root 200. The existing PostgreSQL
deployment `4187bbb4-bc5d-44fb-92da-b40e68022e01` remains `SUCCESS`.
Volume `4495ab33-2440-4d29-a4d4-e214813676a8` remains `Ready` at
`/var/lib/postgresql/data`. PITR bucket
`06fb8382-c35f-43be-b127-3fb98c30f3b0` remains present; PITR is enabled,
bucket-wired, has a live backup, and reports a healthy archiver.

Only after these checks, the retained `railway.json` (SHA-256
`6f9aaeb0803dd8050ba8a0648eea8b800d683eacf328759aa1bfdeb0c0cf1dc1`)
was removed from the repository. The source file remains available from Git
history as the rollback record. No GitHub source was connected, and no
deployment, secret, database, domain, or other Railway resource was changed.

After removing `railway.json`, a second fresh read-only production IaC plan
still returned an empty change set and `No changes`. The repository validation
passed under Node 24.7.0: `pnpm lint`, `pnpm test` (55 passed, 19 skipped),
`pnpm test:postgres` (19 passed), `pnpm test:browser` (10 passed), `pnpm build`,
and `git diff --check`. The foundation acceptance test now reads the IaC
readiness setting; README names the active IaC file. The completed slice changed
no application behavior.
