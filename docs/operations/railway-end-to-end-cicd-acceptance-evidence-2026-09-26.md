# Railway end-to-end CI/CD acceptance evidence — 2026-09-26

**Work item:** `railway-ci-cd-iac`  
**Slice:** `end-to-end-cicd-acceptance`  
**Plan:** `docs/operations/railway-end-to-end-cicd-acceptance-plan.md`  
**Status:** positive, protected-branch negative, and recovery acceptance passed; static version-variable retirement pending separate approval

## Preflight

Local and remote `main` identified
`ba9b03c6ac649851d52bb7b8bf81161a5b76c36b`. GitHub authentication resolved
to repository administrator `olegkirienko`; Railway authentication resolved to
the expected workspace. Node was `24.7.0`, Railway CLI was `5.57.7`, and
Railway agent tooling revision `ca21b2a` reported current and healthy.

No pull request was open. `Validate` was the sole active workflow. Ruleset
`23761397` was active for the default branch, required pull requests and strict
GitHub Actions context `validate`, required resolved conversations, prohibited
deletion and non-fast-forward updates, had no bypass actors, and reported
`current_user_can_bypass: never`. The approved single-owner capability
exception remained zero required GitHub review approvals; it was not changed
for acceptance.

Railway deployment trigger `37dfea95-f342-49fa-af20-08dfbb9d3607` targeted
`olegkirienko/guitar-mastering`, branch `main`, provider `github`, production
environment `994fd373-dd1d-4073-8b7f-116e77d898fa`, and web service
`4d0a3739-0beb-4ea9-9a7e-7a9f3494708e`. It reported `checkSuites: true` and
one valid check suite. Autodeploy reported enabled and eligible. The Railway
IaC plan was clean. Deployment `461b23f8-9b06-4033-b225-f46571b5d350` was
active and successful; the newer bootstrap guard-test deployment
`56a63457-6062-4083-8c06-d2422e4ea45e` remained failed and inactive.
Production health, readiness, API-boundary, and root smoke checks passed.

## Positive controlled release — passed

Pull request 7 carried an application-inert operational change: approved
prior-slice evidence, current source-state IaC representation, final-slice
workflow transition, runbook synchronization, and the reviewed acceptance
plan. It changed no application behavior or migration.

- PR: `https://github.com/olegkirienko/guitar-mastering/pull/7`.
- Head SHA: `2ea07159c6c04d709dd95e9f6fd72046cafa929a`.
- PR `Validate`: run `36242428593`, job `108405320517`, passed in 1m15s.
- Merge time: `2026-09-26T12:37:40Z`.
- Merge SHA: `bc2c6adb82d92c943ed0374cbe38c5a807cf02ae`.
- Push `Validate`: run `36242520082`, job `108405573206`, event `push`, exact
  accepted SHA, started `2026-09-26T12:37:42Z`, completed successfully at
  `2026-09-26T12:38:56Z`. Every required validation step concluded success.
- Run URL:
  `https://github.com/olegkirienko/guitar-mastering/actions/runs/36242520082`.

Railway created deployment `17f0bf39-19bb-4340-8b05-9ac674c8f123` at
`2026-09-26T12:37:42.293Z` for the exact merge SHA. It was observed `WAITING`
while GitHub validation was in progress, then `BUILDING`, `DEPLOYING`, and
`SUCCESS`. No manual deployment or IaC apply occurred.

Deployment logs establish the required order:

1. `2026-09-26T12:41:12.786Z` — verifier passed for workflow run
   `36242520082` and job `108405573206`;
2. `2026-09-26T12:41:12.995Z` — the migration command began;
3. `2026-09-26T12:41:13.148Z` — no migrations were pending and migrations
   completed; and
4. `2026-09-26T12:41:22.753Z` — `server_started` logged full
   `deploymentVersion` `bc2c6adb82d92c943ed0374cbe38c5a807cf02ae`.

The first readiness request also logged that same full deployment version.
Post-promotion smoke returned health 200, readiness 200, unknown API 404, and
root 200. The 30-minute metric snapshot included the new successful deployment,
zero 5xx, HTTP p95 18 ms, current CPU 0 vCPU, and current memory about 147 MB
of 8192 MB. A fresh Railway IaC plan remained clean. The deployment image digest
was `sha256:3f038c11be54ca85366679a6b01b4e2edb08b5b319f3243aaf8272475b586ac1`.

The fixed project, environment, web service, PostgreSQL service, domain,
volume, and PITR bucket identities remained unchanged. Earlier bootstrap CLI
deployment, credential-mode attestation, image-local positive/negative guard
proof, and the explicitly failed first-link rehearsal plus one-time deviation
remain recorded in
`docs/operations/railway-github-autodeploy-plan.md` and
`docs/operations/railway-first-link-rehearsal-evidence-2026-09-25.md`.

## Negative and recovery evidence

The negative branch added only an application-inert marker and a final workflow
step. Its failure condition was the conjunction of `push`,
`refs/heads/main`, and marker presence. Every ordinary validation command ran
before it.

- Negative PR: `https://github.com/olegkirienko/guitar-mastering/pull/8`.
- Negative head SHA: `54a0d01040bab00a7ac7362c48c1564e142e6f21`.
- PR run `36243693214`, job `108408830537`, event `pull_request`, completed
  successfully at `2026-09-26T13:01:21Z`; all ordinary steps and the fixture
  step passed.
- Recovery preview: draft PR 9 from exact removal commit
  `fb7d6dd6b0c634b2151fe740cc41b3d561b15827` targeted the negative branch.
  Its pull-request run `36243695296`, job `108408835371`, completed
  successfully at `2026-09-26T13:01:17Z`. The preview was closed without merge
  after proving the removal patch, then recreated from failed protected
  `main`.
- The unchanged ruleset was read back immediately before merge with no bypass
  and strict `validate` still required.
- Negative merge time: `2026-09-26T13:01:59Z`.
- Negative merge SHA: `80852de1c51ba7fa04c8205bd0aa33f77ab95294`.
- Push run `36243811419`, job `108409140941`, event `push`, exact negative
  SHA, started `2026-09-26T13:02:02Z` and completed with the intended failure
  at `2026-09-26T13:03:13Z`.
- Run URL:
  `https://github.com/olegkirienko/guitar-mastering/actions/runs/36243811419`.

Checkout, setup, install, lint/typecheck, unit/foundation, browser, PostgreSQL,
and production-build steps all concluded success. Only
`Protected-branch negative acceptance fixture` concluded failure with exit 1.
No skip directive, direct push, ruleset bypass, or branch-policy mutation was
used.

Railway created deployment `0605b749-5a7b-4bff-a18b-6bacb9a929ad` at
`2026-09-26T13:02:01.163Z` for the exact negative SHA. It was observed
`WAITING`, then became `SKIPPED` with provider reason
`CI check suite failed`. Railway reported that it had no associated build; its
metadata contained no image digest or Railpack build result, and no pre-deploy,
migration, runtime, or promotion occurred. Positive deployment
`17f0bf39-19bb-4340-8b05-9ac674c8f123` remained the active successful release.
During and after the failure, production smoke again returned health 200,
readiness 200, unknown API 404, and root 200.

Recovery commit `9413149` recreated the already validated preview patch from
the failed protected `main` and removed only the temporary fixture step and
marker. Evidence commit `b1b10ded6058faabd29c89147d524c2a317ab309`
recorded the negative result without changing application behavior.

- Recovery PR: `https://github.com/olegkirienko/guitar-mastering/pull/10`.
- PR `Validate`: run `36244070270`, job `108409858666`, passed.
- Merge time: `2026-09-26T13:08:28Z`.
- Recovery merge SHA: `f8b3510b3ab1e7392ebf97315a91bb7073eb9923`.
- Push `Validate`: run `36244168991`, job `108410127894`, event `push`, exact
  recovery SHA, started `2026-09-26T13:08:30Z`, completed successfully at
  `2026-09-26T13:09:38Z`; every required step concluded success.
- Run URL:
  `https://github.com/olegkirienko/guitar-mastering/actions/runs/36244168991`.

Railway created recovery deployment `abd82366-6c2d-4427-b65f-cb81be65f546`
at `2026-09-26T13:08:30.003Z` for the exact recovery SHA. It was observed
`WAITING` while GitHub validation ran and reached `SUCCESS` with image digest
`sha256:f6ee7460320d1b279110c655a3867c44e7d337587c3f746186dd3977795dac6e`.
The verifier passed at `2026-09-26T13:10:34.722Z`; migration began afterward
at `13:10:35.094Z` and completed with no pending migrations at `13:10:35.225Z`.
At `13:10:42.464Z`, both `server_started` and the first readiness request
logged the full recovery SHA as `deploymentVersion`.

Post-recovery smoke returned health 200, readiness 200, unknown API 404, and
root 200. The 30-minute metric snapshot showed zero 5xx, HTTP p95 13 ms,
current CPU about 0.021 vCPU, and current memory about 148 MB of 8192 MB. The
source remained `olegkirienko/guitar-mastering` branch `main`, deployment
trigger `37dfea95-f342-49fa-af20-08dfbb9d3607` retained
`checkSuites: true` with one valid suite, autodeploy remained enabled and
eligible, and a fresh IaC plan reported no changes.

## Static production version-variable retirement

The successful positive and recovery deployments prove Railway Git metadata
end to end. A separate candidate removes only production
`DEPLOYMENT_VERSION` ownership from `.railway/railway.ts`; the application
fallback remains for earlier CLI rollback images and local/test fixtures. The
redacted provider plan returned `0 add / 0 change / 1 destroy`; the sole
destructive action is deletion of
`guitar-mastering-web-production.DEPLOYMENT_VERSION`. No other resource,
variable, or field appears. Explicit approval of that exact deletion is still
required before apply. See
`docs/operations/railway-deployment-version-retirement-plan.md`.
