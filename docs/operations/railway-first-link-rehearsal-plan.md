# Railway GitHub first-link isolated rehearsal plan

**Work item:** `railway-ci-cd-iac`  
**Slice:** `railway-github-autodeploy`  
**Prepared:** 2026-09-25  
**Status:** executed 2026-09-25; failed closed at repository access; cleanup verified; see `railway-first-link-rehearsal-evidence-2026-09-25.md`

## Question and pass condition

This rehearsal answers only the unresolved first-link questions:

1. Can autodeploy be set to `false` on an empty service before it has a source?
2. Does connecting `olegkirienko/guitar-mastering` branch `main` create a
   deployment immediately when that read-back is `false`?
3. When does the deployment trigger appear, what is its initial `checkSuites`
   value, and can `checkSuites: true` (Wait for CI) be applied while autodeploy
   remains disabled?
4. Does enabling autodeploy after Wait for CI is active create a deployment for
   the already-current commit?

The rehearsal passes only if all of these statements are observed on the
disposable service:

- autodeploy is read back as disabled before source connection;
- source connection creates no deployment;
- Wait for CI is read back as enabled while autodeploy is still disabled;
- enabling autodeploy creates no deployment for the existing branch head; and
- source, trigger, and autodeploy ordering is unambiguous from captured client
  UTC timestamps and Railway deployment timestamps.

Any deployment caused by source connection, Wait-for-CI activation, or
autodeploy activation fails the rehearsal. A deployment that is safe only
because the current commit already passed CI does not satisfy the production
first-link requirement.

## Isolation and hard exclusions

Use a fresh disposable Railway project in workspace
`0b444469-be55-4550-9c08-73c011326e77`. A project containing its default
environment and one empty service is the smallest scope that is both capable
of reproducing a GitHub source connection and isolated from the existing
project. Name it `gm-first-link-rehearsal-<UTC timestamp>` and name its only
service `first-link-probe`.

Create no database, volume, bucket, domain, variable, secret, network setting,
IaC association, or second service. Do not deploy local source. Do not run
application, migration, smoke, or SSH commands. Use the real repository and
branch only for the source behavior under test; arrange a no-push window on
`main` from baseline capture through final observation.

The following production identities are denied targets for every mutation:

- project `112644ba-cb91-443b-ae4b-73a0d6f74b69`;
- environment `994fd373-dd1d-4073-8b7f-116e77d898fa`;
- web service `4d0a3739-0beb-4ea9-9a7e-7a9f3494708e`.

Before every mutation, compare its explicit project, environment, and service
IDs with those values. Stop on any match. Do not use locally linked implicit
context and do not run `railway link`.

## Provider surface captured before execution

The planning preflight on 2026-09-25 observed Railway CLI `5.57.7` and healthy
agent tooling revision `ca21b2a`. Current CLI help exposes
`railway service source connect --repo <owner/repo> --branch <branch>` but no
no-deploy flag. Current official
[GitHub autodeploy documentation](https://docs.railway.com/deployments/github-autodeploys)
explains how to disable autodeploy and enable Wait for CI after a repository is
connected, while the [service documentation](https://docs.railway.com/services)
describes connecting a repository. Neither states whether initial connection
creates a deployment or whether either setting can be established atomically
before it.

The read-only live GraphQL schema exposes these separate provider operations:

- `serviceConnect(id, input: {repo, branch})`;
- `serviceInstanceAutoDeployStatus(projectId, environmentId, serviceId)`;
- `serviceInstanceAutoDeployUpdate(input: {projectId, environmentId,
  serviceId, enabled})`;
- `deploymentTriggers(projectId, environmentId, serviceId)`;
- `deploymentTriggerUpdate(id, input: {checkSuites})`.

`Deployment` exposes `id`, `createdAt`, `updatedAt`, `statusUpdatedAt`,
`status`, `projectId`, `environmentId`, `serviceId`, and `meta`. These schema
facts define the observations to capture; they do not prove safe ordering.
Re-run the CLI/version/schema preflight immediately before rehearsal execution
and stop if the controls or field shapes changed.

## Evidence protocol

Use one stable Railway telemetry session for the entire rehearsal. For every
provider call, record:

- operation name and redacted variables;
- client UTC timestamp immediately before invocation;
- client UTC timestamp immediately after response;
- response or exact error;
- source, trigger, and autodeploy read-back immediately afterward; and
- the complete deployment list for the disposable service, including every
  deployment ID, `createdAt`, `statusUpdatedAt`, and status.

Start a deployment-history watcher before the first setting mutation. Poll the
explicit disposable IDs at least once per second through source connection and
for 30 seconds afterward, then every five seconds through two minutes. Repeat
that observation window after enabling Wait for CI and after enabling
autodeploy. Provider `createdAt` is the authoritative deployment-creation time;
client timestamps bound the ordering of setting actions and read-backs.

Also record the full `main` SHA and its latest push-event `Validate` run ID and
completion time before the no-push window. This is correlation evidence only,
not permission for the rehearsal to deploy it.

## Ordered rehearsal

Execution requires explicit approval of this plan. After approval:

1. Re-run Railway auth, CLI version, tooling health, and the schema checks
   above. Record the production project read-only and confirm its web source is
   still unset; do not query secret values.
2. Create the disposable project without a repository, then query it to obtain
   its default environment ID. Create one empty service without `source` or
   variables. Assert all three generated IDs differ from the denied production
   IDs. Capture a zero-deployment baseline, `source.repo: null`, the current
   autodeploy status, and the deployment-trigger list.
3. Invoke `serviceInstanceAutoDeployUpdate` with `enabled: false` against only
   the disposable IDs. Read back `enabled: false`. If the provider rejects this
   before a source exists or does not persist it, record the exact behavior and
   continue only far enough to observe the isolated first-link result; the
   rehearsal cannot pass.
4. While the watcher is running and `main` is frozen, invoke exactly one source
   connection for `olegkirienko/guitar-mastering`, branch `main`, against the
   disposable service. Do not combine this with any other setting change.
   Capture the call boundary timestamps, source read-back, autodeploy read-back,
   newly created deployment trigger and its initial `checkSuites` value, and
   all deployment IDs/timestamps/statuses.
5. If any deployment appears, keep autodeploy disabled, record that exact
   deployment through a terminal state or project cleanup, and skip steps 6-7.
   Do not attempt to make the result pass by reconnecting, changing branch, or
   using a second service.
6. If no deployment appeared and autodeploy is still disabled, set
   `checkSuites: true` on the single created deployment trigger. Read back the
   same trigger ID, repository, branch, `checkSuites: true`, and autodeploy
   still disabled. Observe the full two-minute deployment window. Any
   deployment fails the rehearsal.
7. If the state remains deployment-free, enable autodeploy on only the
   disposable service. Read back autodeploy enabled and the unchanged trigger
   with `checkSuites: true`. Observe the full two-minute window. Any deployment
   for the already-current branch head fails the rehearsal. Disable autodeploy
   again before cleanup.
8. Capture the final source, trigger, autodeploy, and complete deployment
   history. Preserve IDs and timestamps in a new immutable evidence artifact at
   `docs/operations/railway-first-link-rehearsal-evidence-<date>.md`.
9. Delete the entire disposable project by its explicit generated ID. Project
   deletion is scheduled by Railway, so poll project/list reads until the
   project is absent or reported deleted. Search the workspace for the exact
   project and service IDs and require no live rehearsal resource. If deletion
   remains pending, record the IDs, keep production blocked, and continue
   cleanup rather than declaring the rehearsal complete.

Cleanup is mandatory after both pass and fail outcomes. Preserve only the
repository evidence artifact; no Railway rehearsal resource may remain.

## Decision and production boundary

If every pass condition holds, add to
`docs/operations/railway-github-autodeploy-plan.md` the exact observed
production sequence, using the same provider operations and read-backs:

1. disable autodeploy and verify disabled;
2. connect the repository and verify zero deployments;
3. enable Wait for CI on the created trigger and verify it while autodeploy is
   still disabled;
4. enable autodeploy and verify no deployment for the existing branch head;
5. leave the first deployment to a later controlled `main` push.

Do not add that sequence merely because the API fields exist; add it only after
the isolated evidence proves every ordering and zero-deployment assertion. If
any pass condition fails or cleanup is incomplete, keep production source
unset and submit a design amendment instead.

Even after a passing rehearsal and operator-plan update, stop before every
production source, Wait for CI, or autodeploy mutation. The final production
source-setting sequence requires a fresh explicit human approval that does not
carry over from rehearsal approval.
