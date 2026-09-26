# Railway static deployment-version retirement plan

**Work item:** `railway-ci-cd-iac`  
**Slice:** `end-to-end-cicd-acceptance`  
**Prepared:** 2026-09-26  
**Status:** pending separate review and explicit apply approval

## Proven entry condition

GitHub-triggered positive deployment `17f0bf39-19bb-4340-8b05-9ac674c8f123`
and recovery deployment `abd82366-6c2d-4427-b65f-cb81be65f546` both logged
Railway's full `RAILWAY_GIT_COMMIT_SHA` as `deploymentVersion`. Each value
matched its protected `main` merge SHA, push `Validate` run, Railway deployment
metadata, `server_started`, and request log. The exact-SHA verifier passed
before migration in both deployments.

The production static `DEPLOYMENT_VERSION` variable is therefore no longer
needed by the active GitHub source path. Application code retains its fallback
for earlier CLI-built rollback images and local/test fixtures, as required by
the approved design.

## Exact configuration change

Remove only `DEPLOYMENT_VERSION: preserve()` and its now-satisfied transition
comment from the existing production web-service environment map in
`.railway/railway.ts`.

The plan must target only:

- project `112644ba-cb91-443b-ae4b-73a0d6f74b69`;
- environment `994fd373-dd1d-4073-8b7f-116e77d898fa`; and
- web service `4d0a3739-0beb-4ea9-9a7e-7a9f3494708e`.

The redacted candidate plan returned `0 to add, 0 to change, 1 to destroy`.
Railway classifies deletion of the single existing variable as the one
destructive action:

`Delete variable guitar-mastering-web-production.DEPLOYMENT_VERSION`

Require exactly that one variable deletion, with no source, branch,
Wait-for-CI, command, gate, credential, secret value, identity, topology,
database, volume, domain, PITR, or other variable change. The plan must keep
values redacted. Because the provider classifies it as destructive, the owner
must explicitly approve this exact deletion before apply.

## Reviewed apply sequence

1. Validate the repository and read back identities, active recovery deployment,
   source trigger, Wait for CI, autodeploy, health, smoke, and an otherwise
   clean IaC baseline.
2. Review the exact redacted plan. Do not apply until the owner explicitly
   approves this one-variable removal.
3. Merge the IaC source change through the protected branch and require its
   pull-request and distinct push `Validate` runs. Observe the ordinary
   GitHub-triggered deployment through exact-SHA verification, migration,
   success, logs, smoke, and metrics.
4. Recreate the redacted plan on the merged source. Continue only if it is
   semantically identical: `0 add / 0 change / 1 destroy`, removing only
   production `DEPLOYMENT_VERSION`.
5. Apply the reviewed plan. Read back only variable names/presence, never
   values. Verify the static name is absent, no unrelated field changed, and
   record whether Railway created a deployment.
6. If a deployment is created, follow that exact ID to a terminal state and
   require the GitHub metadata path, guard, migration, readiness, SHA logs,
   smoke, metrics, identities, and clean follow-up plan. If no deployment is
   created, require the active recovery deployment and smoke to remain healthy.

Any additional plan action, secret disclosure, unexpected deployment source,
missing Git SHA, failed guard/migration/readiness, identity drift, or health
failure stops the change. Do not remove the application fallback or any other
variable.
