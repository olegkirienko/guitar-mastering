# Railway GitHub first-link isolated rehearsal evidence — 2026-09-25

**Work item:** `railway-ci-cd-iac`  
**Slice:** `railway-github-autodeploy`  
**Plan:** `docs/operations/railway-first-link-rehearsal-plan.md`  
**Outcome:** failed closed before source connection; production remains blocked

## Scope and preflight

The owner approved only the disposable rehearsal. One stable Railway telemetry
session, `railway-skill-20260925-first-link-rehearsal`, was used throughout.
Railway CLI `5.57.7` and agent tooling revision `ca21b2a` were current and
healthy. The live schema retained the planned `serviceConnect`,
`serviceInstanceAutoDeployStatus`, `serviceInstanceAutoDeployUpdate`,
`deploymentTriggers`, `deploymentTriggerUpdate`, and `Deployment` fields.

The denied production identities were checked before every scoped provider
operation:

- project `112644ba-cb91-443b-ae4b-73a0d6f74b69`;
- environment `994fd373-dd1d-4073-8b7f-116e77d898fa`;
- web service `4d0a3739-0beb-4ea9-9a7e-7a9f3494708e`.

No mutation contained any denied identity. Workspace-wide read-only inventory
before and after the rehearsal showed production web source `repo: null` and
`image: null`. No production source, Wait for CI, autodeploy, variable, IaC,
GitHub source, deployment, service, database, volume, domain, or PITR mutation
was attempted.

The no-push baseline and final read-back both reported `main` SHA
`ba9b03c6ac649851d52bb7b8bf81161a5b76c36b`. Its latest completed push
`Validate` run was `36116896667`, conclusion `success`, completed at
`2026-09-25T09:11:07Z`.

## Disposable identities

- workspace: `0b444469-be55-4550-9c08-73c011326e77`;
- project: `a05b32a4-f354-4de2-aadb-315990f23b1b`;
- environment: `4201ac3a-63bd-4368-b62e-605a50c0cdc7`;
- service: `26b137b9-4601-43bf-b893-ff822e1cc7d7` (`first-link-probe`).

The requested long UTC project name exceeded Railway's 32-character limit, so
the plan's unspecified timestamp placeholder was represented by compact UTC
hour `26092509`: `gm-first-link-rehearsal-26092509`. The initial invalid-name
request created no project. A provider rate-limit response on the next request
also created no project. The successful project create call ran from
`2026-09-25T09:32:33.546Z` to `2026-09-25T09:32:35.071Z`; Railway recorded
project creation at `2026-09-25T09:32:33.832Z` and environment creation at
`2026-09-25T09:32:33.882Z`. The service create call ran from
`2026-09-25T09:33:23.163Z` to `2026-09-25T09:33:24.914Z`; Railway recorded
service creation at `2026-09-25T09:33:23.452Z`.

Baseline read-back from `2026-09-25T09:34:05.357Z` through
`2026-09-25T09:34:06.642Z` showed:

- source `null`;
- `hasEverDeployed: false` and no latest deployment;
- autodeploy `enabled: false`, `canEnable: false`, reason `NO_REPO`;
- no deployment trigger; and
- zero deployments.

No database, volume, bucket, domain, variable, secret, network setting, IaC
association, second service, or local deployment was created.

## Observed transition ordering

The deployment watcher started at `2026-09-25T09:34:32.870Z`. It started a
poll every second through `2026-09-25T09:35:08.045Z`, then polled approximately
every five seconds. Every completed poll through the post-error capture
returned an empty deployment list.

1. Autodeploy-disable invocation started at `2026-09-25T09:35:06.339Z` and
   returned at `2026-09-25T09:35:09.238Z` with `enabled: false`.
2. Immediate read-back from `2026-09-25T09:35:09.241Z` through
   `2026-09-25T09:35:10.507Z` showed source `null`, autodeploy disabled, no
   trigger, and zero deployments. This proves autodeploy can be safely written
   before a first deployment and before source connection.
3. The single `serviceConnect` invocation started at
   `2026-09-25T09:35:32.177Z`, targeting repository
   `olegkirienko/guitar-mastering` and branch `main` on only the disposable
   service. Railway rejected it with `BAD_USER_INPUT: User does not have access
   to the repo`, trace ID `4118968244649701621`. Because the CLI exited on the
   GraphQL error, the shell did not emit its planned post-response timestamp;
   the first subsequent watcher poll began at `2026-09-25T09:35:33.769Z` and
   ended at `2026-09-25T09:35:34.917Z` with zero deployments.
4. Post-error state read-back from `2026-09-25T09:35:55.683Z` through
   `2026-09-25T09:35:56.769Z` showed source still `null`, autodeploy still
   disabled with reason `NO_REPO`, no trigger, `hasEverDeployed: false`, and
   zero deployments.

There were no deployment creation timestamps, deployment IDs, or deployment
statuses because no deployment was created. The source connection itself did
not occur, so this rehearsal does **not** establish whether a successful source
connection triggers deployment. Wait for CI had no before/after boolean state:
no deployment trigger existed before the call and none was created after the
rejected call. Its safe pre-deployment ordering remains untested. Autodeploy was
false both before and after the connection attempt. Steps that would enable
Wait for CI or autodeploy were skipped exactly as required by the stop rule.

## Cleanup

The explicit disposable-project delete call ran from
`2026-09-25T09:36:14.835Z` through `2026-09-25T09:36:15.840Z` and returned
`true`. Railway recorded project `deletedAt: 2026-09-25T09:36:15.249Z`.

Workspace verification from `2026-09-25T09:36:55.111Z` through
`2026-09-25T09:36:56.091Z` found:

- no live project matching the rehearsal ID or name;
- the project only in include-deleted inventory with the recorded `deletedAt`;
- no services or environments remaining on the deleted project;
- no live occurrence of service ID `26b137b9-4601-43bf-b893-ff822e1cc7d7`;
  and
- no live occurrence of environment ID
  `4201ac3a-63bd-4368-b62e-605a50c0cdc7`.

Cleanup is complete and no live rehearsal resource remains.

## Decision

The rehearsal failed closed because the Railway identity could not connect the
repository. It did not prove a deterministic safe production first-link
sequence. The production operator plan therefore receives no source-setting
sequence, and no production source, Wait for CI, or autodeploy action is
authorized. The next workflow action is a narrowly reviewed design amendment
that addresses repository-access proof and any future rehearsal retry.
