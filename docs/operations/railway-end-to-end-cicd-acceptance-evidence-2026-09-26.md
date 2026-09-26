# Railway end-to-end CI/CD acceptance evidence — 2026-09-26

**Work item:** `railway-ci-cd-iac`  
**Slice:** `end-to-end-cicd-acceptance`  
**Plan:** `docs/operations/railway-end-to-end-cicd-acceptance-plan.md`  
**Status:** positive acceptance passed; protected-branch negative test in progress

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

Pending execution. The negative fixture and marker are temporary and
application-inert. They must be removed by the prepared recovery patch after
the failed `main` SHA is proven `SKIPPED` without build, pre-deploy, migration,
or promotion.
