# Railway GitHub autodeploy operator plan

**Work item:** `railway-ci-cd-iac`
**Slice:** `railway-github-autodeploy`
**Design:** `docs/technical-designs/railway-ci-cd-iac.md` and approved Design Amendments 02 and 03
**Status:** targeted `HIGH-04` and `MEDIUM-03` fixes complete and ready for fix re-review; production source, Wait for CI, and Autodeploy are effective; acceptance remains blocked pending approval and next-slice approval

## Fixed scope and identities

This plan may modify only the existing production web service and only in the
order below. It must not create or replace a service, database, volume, bucket,
domain, environment, or project. It must not change schema except through the
existing `pnpm db:migrate` pre-deploy step.

Re-read every identity immediately before each remote action:

- project `112644ba-cb91-443b-ae4b-73a0d6f74b69`;
- production environment `994fd373-dd1d-4073-8b7f-116e77d898fa`;
- web service `4d0a3739-0beb-4ea9-9a7e-7a9f3494708e`;
- PostgreSQL service `82d4b5e1-830a-4467-bb1f-f9448fd1d58d`;
- domain `1cff255c-4eea-493e-9c82-7d2ba1672046`;
- database volume `4495ab33-2440-4d29-a4d4-e214813676a8`;
- PITR bucket `06fb8382-c35f-43be-b127-3fb98c30f3b0`.

The 2026-09-24 read-only preflight found the production deployment
`e0e98aab-e244-4151-8622-3e88a6d4f9ed` successful and running, the effective
pre-deploy command still `pnpm db:migrate`, and the web service source still
unset. These are observations, not permission to mutate them.

## Repository and API evidence

- `server/verify-ci.ts` compiles to `dist-server/verify-ci.js` and
  `release:predeploy` runs it before `pnpm db:migrate`.
- Focused verifier tests pass all 14 cases, including exact SHA, required job
  and steps, authenticated-only access, pagination, rate-limit headroom,
  malformed responses, and bounded retry behavior.
- The built verifier passed a live authenticated, read-only check for `main`
  SHA `dda15469df039e3cbb349d6b3a02f2b015988665`, workflow run `35590758279`,
  and job `106304363143`. No credential value was printed or persisted.
- GitHub reports one active Actions workflow, `.github/workflows/ci.yml`, and
  one completed successful check, `validate`, on current `main`.
- Railway CLI 5.57.7 `service source connect` exposes repository and branch
  selection but no no-deploy or pre-disabled-autodeploy option. Under the
  originally approved design, this made production connection forbidden until
  the separate first-link entry criterion was satisfied. The later
  owner-directed production action did not satisfy that criterion; it is
  reconciled explicitly as a deviation below.

## Historical approval boundary before source linking

An explicit approval of this exact plan is required before any CLI deployment,
credential installation, production variable change, IaC source change/apply,
or image-local SSH proof. Token creation remains a human repository-owner
action. The owner must create a fine-grained token restricted to only
`olegkirienko/guitar-mastering`, with `Actions: read`, unavoidable metadata
read, no write permission, and expiry within 90 days. Never paste the value
into chat, a command argument, a file, logs, or review evidence.

Approval of the bootstrap below did **not** approve production source
connection, Wait for CI, or autodeploy. At that point those actions remained
blocked until first-link behavior was independently proved and the exact
source-setting action was reviewed. The independent proof was never obtained;
the later owner-directed production procedure is recorded below as a one-time
deviation, not as satisfaction of this historical boundary.

## Ordered production bootstrap

Run under Node 24.7.0 with Railway telemetry session
`railway-skill-20260922-github-autodeploy`. Keep the previous successful
deployment ID, readiness result, smoke result, resource identities, config
read-back, and deployment history before every mutation.

1. Merge the reviewed verifier change through the protected `main` branch and
   require its separate successful push `Validate` run. Record the full SHA.
2. With the effective pre-deploy command still `pnpm db:migrate` and neither
   gate variable active, deploy that exact reviewed checkout once via Railway
   CLI to the existing production web service. Capture the returned deployment
   ID and poll that same ID to `SUCCESS`. Verify readiness, smoke, unchanged
   topology, and the previous deployment's availability.
3. Through Railway SSH on that active deployment, prove only that
   `dist-server/verify-ci.js` exists and that `package.json` contains the exact
   `release:predeploy` command. Do not invoke migration.
4. After the owner creates the approved token, stream it over stdin into the
   sealed production variable `GITHUB_ACTIONS_READ_TOKEN`; never put it in a
   shell argument. Confirm only the variable name, sealed state, repository
   scope, permissions, and expiry. If activation causes or requires a
   deployment, it must use the already verified image and old migration-only
   command; observe that exact deployment through `SUCCESS`, readiness, and
   smoke.
5. Change `.railway/railway.ts` only to preserve
   `GITHUB_ACTIONS_READ_TOKEN`, set `GITHUB_CI_GATE_REQUIRED` to literal
   `false`, and change the web pre-deploy command to
   `pnpm release:predeploy`. Save a Railway IaC plan outside `.railway/`.
   Require exactly zero adds, one existing-web-service change, and zero
   deletes, with no source or topology change. Apply only that reviewed saved
   plan, then read back the command, literal flag, sealed token name, effective
   `ON_FAILURE`/three-retry exception, deployment history, readiness, and smoke.
6. In the verified active image, use Railway SSH to invoke only
   `node dist-server/verify-ci.js`, temporarily setting the process-local gate
   to `true`. Prove the known successful full `main` SHA passes, then prove an
   impossible full SHA fails nonzero. Record only statuses, rate-limit metadata,
   run/job IDs, exit codes, and redacted diagnostics. Never invoke
   `release:predeploy` or `db:migrate` during this proof.
7. Change the IaC literal gate from `false` to `true`, create and review a new
   saved plan limited to that single variable, and apply it. If this produces a
   CLI-source deployment without Railway Git metadata, require it to fail
   before migration and confirm the prior healthy deployment remains serving.
   Read back effective future config, pending changes, deployment history,
   readiness, smoke, and unchanged identities. Never set the flag back to
   `false` merely to force a successful CLI deployment.

Stop immediately on any unexpected deployment, nonmatching identity, add or
delete, source mutation, missing artifact, secret disclosure, migration before
guard success, verifier ambiguity, unhealthy prior deployment, or failure to
read back effective configuration.

## Bootstrap execution evidence — 2026-09-24

- Pull request 5 passed its `validate` check and merged normally. Merge commit
  `7e8a3eb88246c3c5fdc676b9d5f18347e9a6098f` then passed the separate
  push-triggered `Validate` run `35979509606`, job `107567779717`.
- Immediately before deployment, the production web service still had no
  source, deployment `e0e98aab-e244-4151-8622-3e88a6d4f9ed` was successful,
  its effective pre-deploy command was `pnpm db:migrate`, all fixed topology
  identities matched, and the complete production smoke passed.
- The exact validated checkout was deployed once through the CLI to existing
  web service `4d0a3739-0beb-4ea9-9a7e-7a9f3494708e`. Deployment
  `063aef0c-bff0-4587-9eb7-0328dc56c729` reached `SUCCESS` with image digest
  `sha256:c04ba3593ddfdfb34ad9f2fc58566b338b452ec074408a8d0b6ab6ef938b0f7f`.
  Its manifest retained `pnpm db:migrate`, `/api/v1/readiness`, the 120-second
  health timeout, and effective `ON_FAILURE` with three retries. Post-deploy
  health, readiness, SPA, and unknown-API smoke checks passed.
- Read-only SSH on running instance
  `c28ad783-76c7-49f9-a722-105c5a37ef6c` proved
  `dist-server/verify-ci.js` exists and `package.json` contains the exact
  `node dist-server/verify-ci.js && pnpm db:migrate` script. No migration or
  verifier command was invoked by the SSH proof.
- Presence-only checks found `GITHUB_ACTIONS_READ_TOKEN` absent both locally
  and in the deployed image. Execution stops before credential installation,
  IaC changes, or further deployment until the owner creates the approved
  fine-grained token. No source, Wait for CI, or autodeploy setting changed.

## Bootstrap continuation evidence — 2026-09-25

- The owner staged `GITHUB_ACTIONS_READ_TOKEN` on the fixed production web
  service without deploying. Redacted staged-patch read-back showed patch
  `75d6d102-9375-41df-a0dc-91a22b9b2a11` contained exactly that one variable
  on service `4d0a3739-0beb-4ea9-9a7e-7a9f3494708e`, with no deploy or source
  field. The patch was committed with deploys skipped. Post-commit read-back
  reported the variable present and sealed, while deployment history remained
  unchanged. Repository scope, `Actions: read`, metadata-only unavoidable
  access, no write permission, and expiry within 90 days are owner-attested;
  the token value was never displayed or persisted in repository evidence.
- `.railway/railway.ts` now preserves `GITHUB_ACTIONS_READ_TOKEN`, uses
  `pnpm release:predeploy`, and declares `GITHUB_CI_GATE_REQUIRED` explicitly.
  The first saved plan reported zero adds, two expected property changes on the
  one existing web service, and zero destroys: add the bootstrap `false` flag
  and change only the pre-deploy command. Applying that pinned plan triggered
  deployment `461b23f8-9b06-4033-b225-f46571b5d350`, which reached `SUCCESS`.
  Its logs show the explicit bootstrap bypass followed by no pending
  migrations; smoke passed; source remained unset; the token remained sealed;
  and effective restart behavior remained `ON_FAILURE` with three retries.
- Read-only SSH on running instance
  `a3a7ff2f-ebd0-440a-9b7f-04bf1f9e56a2` invoked only
  `node dist-server/verify-ci.js` with a process-local true gate. Main SHA
  `7e8a3eb88246c3c5fdc676b9d5f18347e9a6098f` passed against workflow run
  `35979509606` and job `107567779717`; an impossible full SHA failed with exit
  code 1 and the nonsecret no-matching-run diagnostic. A discarded shell
  wrapper attempt exited 127 because its non-login shell lacked Node in PATH;
  it did not execute the verifier or migration and is not acceptance evidence.
- The second saved plan reported zero adds, exactly one variable change, and
  zero destroys. Applying it set `GITHUB_CI_GATE_REQUIRED` to literal `true`
  and triggered CLI-source deployment
  `56a63457-6062-4083-8c06-d2422e4ea45e`. That deployment failed in the
  verifier because `RAILWAY_GIT_COMMIT_SHA` was absent. Its logs contain only
  the `release:predeploy` script echo and no actual `node-pg-migrate`,
  `Migrations complete`, or `No migrations to run` output. Prior deployment
  `461b23f8-9b06-4033-b225-f46571b5d350` remains active and successful;
  production smoke passed after the failure.
- Final read-back proves a clean IaC plan, sealed token, true gate,
  `pnpm release:predeploy`, effective `ON_FAILURE`/three retries, no GitHub
  source, unchanged project/environment/service/domain/PostgreSQL/volume/PITR
  identities, and no pending production change. No source connection, Wait for
  CI, or autodeploy mutation was attempted.

## Manual production source-link operator checklist

Run this checklist manually in the Railway dashboard against the existing
production web service. Make no commit or push while it is in progress. The
exact-SHA pre-deploy verifier and every existing fail-closed condition remain
unchanged.

- [ ] Verify the live project, production environment, web service,
  PostgreSQL service, domain, volume, and PITR bucket match the fixed IDs
  above. Record the currently serving deployment ID and exact status; require
  readiness and the canonical production smoke check to pass. Also verify
  `pnpm release:predeploy`, `GITHUB_CI_GATE_REQUIRED=true`, the sealed token
  name, and an unset GitHub source.
- [ ] Verify **Autodeploy is OFF** and read the setting back before selecting a
  repository. Stop on any mismatch.
- [ ] On existing web service `4d0a3739-0beb-4ea9-9a7e-7a9f3494708e`, manually
  connect repository `olegkirienko/guitar-mastering` and branch `main`. Do not
  create or replace any Railway resource.
- [ ] Immediately inspect deployment history and compare it with the recorded
  baseline.
- [ ] If Railway created any deployment, make no further setting change. Record
  and report that deployment's ID, exact current status, source SHA when
  present, and UTC observation time, then stop. Do not enable Wait for CI or
  Autodeploy.
- [ ] If and only if no deployment was created, enable **Wait for CI** and read
  it back as enabled.
- [ ] Enable **Autodeploy** and read it back as enabled.
- [ ] Verify the effective source is `olegkirienko/guitar-mastering`, the branch
  is `main`, Wait for CI is enabled, Autodeploy is enabled, watch paths remain
  empty, all production identities are unchanged, and the previously recorded
  deployment is still serving with passing readiness and smoke. Reconfirm the
  exact-SHA verifier command, true gate, and sealed token name are unchanged.
- [ ] Stop before creating, merging, or pushing any acceptance commit. Record
  the redacted settings read-back and UTC timestamps for implementation review.

## Initial manual source-link read-back — 2026-09-25

The owner reported manually selecting repository
`olegkirienko/guitar-mastering` and branch `main` on the production web service,
with no further Railway setting changes. Read-only Railway CLI 5.57.7 and live
GraphQL inspection completed at `2026-09-25T10:09:12Z` against the fixed
project, production environment, and web-service IDs.

- The effective service-instance source remained `repo: null`, `image: null`.
- Both service repository triggers and production deployment triggers were
  empty, so no effective `main` branch setting or Wait for CI setting existed.
- Autodeploy remained disabled: `enabled: false`, `canEnable: false`, reason
  `NO_REPO`. No autodeploy mutation was performed during inspection.
- The environment had no unmerged change count. The service and service-instance
  update timestamps remained older than the reported manual action.
- No deployment was created. The newest history entry remained failed bootstrap
  deployment `56a63457-6062-4083-8c06-d2422e4ea45e`, created
  `2026-09-25T09:03:05.931Z` and terminal at
  `2026-09-25T09:04:30.042Z`. Active deployment
  `461b23f8-9b06-4033-b225-f46571b5d350` remained `SUCCESS` and running.

The reported dashboard action therefore did not become effective on the fixed
production service. Stop here: do not enable Wait for CI, do not change
Autodeploy, and do not create an acceptance commit. Before any retry, re-confirm
the dashboard targets production environment
`994fd373-dd1d-4073-8b7f-116e77d898fa` and web service
`4d0a3739-0beb-4ea9-9a7e-7a9f3494708e`; after the retry, repeat this read-only
source, trigger, autodeploy, and deployment-history inspection first.

## Explicit first-link deviation and manual source commit — 2026-09-25/26

The original first-link proof requirement was **not** satisfied. The isolated
rehearsal failed before source connection because its Railway identity could
not access the repository. It therefore did not prove whether successful
connection creates a deployment or whether Wait for CI can be enabled before
the first deployment. The immutable rehearsal evidence remains unchanged and
must not be cited as a passing proof.

After the ineffective initial dashboard selection above, the owner manually
retried against the fixed production service as an explicit one-time deviation
from the approved pre-link proof path:

- The exact-SHA pre-deploy verifier was already effective as
  `pnpm release:predeploy`, `GITHUB_CI_GATE_REQUIRED=true` was the effective
  future service value, and image-local positive and fail-closed behavior had
  already been proved before this source action.
- With autodeploy disabled, the owner staged source
  `olegkirienko/guitar-mastering` and branch `main` on the existing production
  web service.
- The owner committed that staged source without redeploy. Deployment history
  did not gain a source-link deployment; failed guard-test deployment
  `56a63457-6062-4083-8c06-d2422e4ea45e` remained newest and successful
  deployment `461b23f8-9b06-4033-b225-f46571b5d350` remained active.
- After the no-deployment result, Wait for CI and then autodeploy were enabled.
- The read-only verification below confirmed repository, branch, Wait for CI,
  autodeploy, empty watch paths, pre-deploy settings, deployment history, and
  production health/smoke.

This sequence records what occurred and its observed safe result. It does not
claim that the approved independent first-link proof existed, that the original
entry criterion passed, or that the deviation is a reusable source-link
procedure. No acceptance commit or GitHub-triggered production deployment was
created.

## Final source-link verification — 2026-09-26

Read-only Railway CLI 5.57.7 and live GraphQL verification completed at
`2026-09-26T11:06:58Z` against the fixed production project, environment, and
web-service IDs. No Railway, GitHub, application, or acceptance-commit mutation
was performed by this verification.

- Effective source is `olegkirienko/guitar-mastering`. Deployment trigger
  `37dfea95-f342-49fa-af20-08dfbb9d3607` targets branch `main`, provider
  `github`, and the fixed production environment and service.
- Wait for CI is effective: the trigger reports `checkSuites: true` and one
  valid check suite. Autodeploy reports `enabled: true`, `canEnable: true`, and
  no blocking reason. Watch paths remain empty.
- The environment has an empty staged patch and no apply error. Source-link
  activation created no deployment: newest history remains failed guard-test
  deployment `56a63457-6062-4083-8c06-d2422e4ea45e`, created at
  `2026-09-25T09:03:05.931Z`, before the effective source update.
- Deployment `461b23f8-9b06-4033-b225-f46571b5d350` remains the sole active
  deployment, reports `SUCCESS`, and has running instance
  `a3a7ff2f-ebd0-440a-9b7f-04bf1f9e56a2`. Production health, readiness, and
  root returned `200`; the unknown API route returned the expected `404`.
- Effective future configuration retains `pnpm release:predeploy`, literal
  `GITHUB_CI_GATE_REQUIRED=true`, the sealed credential variable name, and the
  previously image-proved `dist-server/verify-ci.js` artifact. The active
  bootstrap instance retains its earlier process-local false snapshot because
  the later true-gate CLI deployment failed closed and never promoted; the
  effective service value for the first GitHub-triggered deployment is true.

Stop here. The `railway-github-autodeploy` slice is ready for targeted fix
re-review. Do not create, merge, or push an acceptance commit until the slice
is approved and the owner explicitly accepts the next-slice gate for
`end-to-end-cicd-acceptance`.

## IaC source parity targeted fix — 2026-09-26

Implementation Review 14 found that the post-link Railway IaC file omitted the
effective GitHub source and would therefore propose removing the repository and
Wait for CI on a future apply. The targeted `HIGH-04` fix represents the
already-effective desired state with Railway SDK 3.11.0:

- repository `olegkirienko/guitar-mastering`;
- branch `main`; and
- `checkSuites: true` (Wait for CI).

The source declaration does not manage or change the separate autodeploy
status. Existing build, verifier/pre-deploy, variables, restart policy,
identity, and topology declarations are unchanged.

At `2026-09-26T11:22:33Z`, authenticated Railway CLI 5.57.7 evaluated the
updated file under Node 24.7.0 against linked project
`112644ba-cb91-443b-ae4b-73a0d6f74b69` and production environment
`994fd373-dd1d-4073-8b7f-116e77d898fa`. The read-only plan returned
`Your Railway configuration is already up to date` with no source, branch,
Wait-for-CI, variable, command, identity, topology, add, change, or destroy
operation. No `config apply`, deployment, source update, variable update, or
other provider mutation followed.

## Credential lifecycle

Rotate at least seven days before expiry through another reviewed production
variable action. Prove both API endpoints and a positive image-local verifier
run before revoking the old token. On suspected disclosure, revoke immediately,
keep source/autodeploy changes disabled, confirm the prior healthy deployment,
and require a reviewed replacement. Missing, expired, revoked, rejected, or
rate-limited credentials must fail before migration and must never fall back to
anonymous access.
