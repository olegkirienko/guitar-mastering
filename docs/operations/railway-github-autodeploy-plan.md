# Railway GitHub autodeploy operator plan

**Work item:** `railway-ci-cd-iac`
**Slice:** `railway-github-autodeploy`
**Design:** `docs/technical-designs/railway-ci-cd-iac.md` and approved Design Amendments 02 and 03
**Status:** bootstrap approved on 2026-09-24; protected-branch merge and ordered production bootstrap in progress; source connection still awaits first-link proof and separate approval

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
  selection but no no-deploy or pre-disabled-autodeploy option. Therefore this
  command is forbidden on production until the separate first-link entry
  criterion below is satisfied.

## Approval boundary

An explicit approval of this exact plan is required before any CLI deployment,
credential installation, production variable change, IaC source change/apply,
or image-local SSH proof. Token creation remains a human repository-owner
action. The owner must create a fine-grained token restricted to only
`olegkirienko/guitar-mastering`, with `Actions: read`, unavoidable metadata
read, no write permission, and expiry within 90 days. Never paste the value
into chat, a command argument, a file, logs, or review evidence.

Approval of the bootstrap below does **not** approve production source
connection, Wait for CI, or autodeploy. Those remain blocked until first-link
behavior is independently proved and the exact source-setting action is
reviewed.

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

## First-link entry criterion and remaining block

Before any production source mutation, obtain one of:

1. current Railway documentation or Railway support confirmation that proves
   whether initial source connection deploys immediately and proves the exact
   order for disabling autodeploy and enabling Wait for CI before that first
   deploy; or
2. an explicitly approved isolated same-feature rehearsal whose effects and
   cleanup are outside production and recorded without creating a new resource
   in this work item.

The public documentation and CLI help observed on 2026-09-24 do not satisfy
this criterion. Until it is satisfied, do not run `railway service source
connect`, do not select the repository in the production UI, and do not enable
Wait for CI or autodeploy. After proof exists, write the exact production
setting sequence into this plan and obtain a new explicit approval for that
source-setting action.

## Credential lifecycle

Rotate at least seven days before expiry through another reviewed production
variable action. Prove both API endpoints and a positive image-local verifier
run before revoking the old token. On suspected disclosure, revoke immediately,
keep source/autodeploy changes disabled, confirm the prior healthy deployment,
and require a reviewed replacement. Missing, expired, revoked, rejected, or
rate-limited credentials must fail before migration and must never fall back to
anonymous access.
