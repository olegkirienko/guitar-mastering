# Railway end-to-end CI/CD acceptance plan

**Work item:** `railway-ci-cd-iac`  
**Slice:** `end-to-end-cicd-acceptance`  
**Prepared:** 2026-09-26  
**Status:** authorized for execution by the explicit `next_slice_approval`

## Scope and invariants

This plan executes only the authoritative positive and protected-branch
negative acceptance in `docs/technical-designs/railway-ci-cd-iac.md`. It does
not change application behavior or database migrations, weaken branch rules,
bypass the required `validate` check, apply Railway IaC, recreate resources, or
expose secret values.

The production target must remain:

- project `112644ba-cb91-443b-ae4b-73a0d6f74b69`;
- environment `994fd373-dd1d-4073-8b7f-116e77d898fa`;
- web service `4d0a3739-0beb-4ea9-9a7e-7a9f3494708e`;
- PostgreSQL service `82d4b5e1-830a-4467-bb1f-f9448fd1d58d`;
- domain `1cff255c-4eea-493e-9c82-7d2ba1672046`;
- database volume `4495ab33-2440-4d29-a4d4-e214813676a8`; and
- PITR bucket `06fb8382-c35f-43be-b127-3fb98c30f3b0`.

Before every merge, require the active `main` ruleset, pull requests, strict
GitHub Actions `validate`, resolved conversations, deletion and force-push
protection, and no bypass actors. The approved single-owner capability
exception remains zero required GitHub review approvals; the owner's explicit
workflow-gate approval is the human authorization for this acceptance run. Do
not change that policy during acceptance.

## Recorded preflight

At the 2026-09-26 preflight:

- local and remote `main` both identified
  `ba9b03c6ac649851d52bb7b8bf81161a5b76c36b`;
- no pull request was open and `Validate` was the sole active workflow;
- ruleset `23761397` was active, strict, and reported
  `current_user_can_bypass: never`;
- deployment trigger `37dfea95-f342-49fa-af20-08dfbb9d3607` targeted
  `olegkirienko/guitar-mastering`, branch `main`, with `checkSuites: true` and
  one valid check suite;
- autodeploy was enabled and eligible;
- the latest deployment remained failed bootstrap guard check
  `56a63457-6062-4083-8c06-d2422e4ea45e`, while deployment
  `461b23f8-9b06-4033-b225-f46571b5d350` remained active and successful;
- the production IaC plan reported no changes; and
- health, readiness, the unknown-API boundary, and the SPA root passed.

Any identity, ruleset, workflow inventory, source, trigger, gate, IaC, or
health drift is a stop condition.

## Positive controlled release

1. Create a branch from the recorded `main`. The inert observable change is
   the approved CI/CD documentation, IaC source-state representation, immutable
   prior-slice review records, and this acceptance plan. It changes no runtime
   application behavior or migration.
2. Run the full repository validation under Node 24.7.0. Open a pull request
   without a skip directive and require the PR `Validate` run to succeed.
3. Re-read the ruleset and merge normally through the protected branch. Record
   the PR, merge time, full merge SHA, push-run URL, job and required-step
   conclusions, and UTC completion time.
4. Observe Railway create a deployment for that exact SHA. Record `WAITING`
   when observable, then require the same deployment to reach `SUCCESS`. A
   different SHA, skipped/neutral/cancelled check, verifier ambiguity, or an
   unexpected IaC/configuration action stops acceptance.
5. Prove logs order the exact-SHA verifier success before migration success,
   and prove `server_started` plus a request log use the same full SHA as
   GitHub and Railway metadata. Run readiness and production smoke; inspect
   HTTP, CPU, memory, network, and volume metrics; re-read source, Wait for CI,
   autodeploy, commands, restart behavior, identities, PITR, and a clean IaC
   plan.
6. Only after the full-SHA proof, prepare a separate reviewed configuration
   change to retire the production `DEPLOYMENT_VERSION` variable. Do not remove
   the application fallback needed by CLI rollback images and local/test
   fixtures. Apply only an exact reviewed no-add/no-destroy plan, read back the
   variable-name set without values, and verify no unplanned deployment or
   health change.

## Protected-branch negative test and prepared recovery

1. From the accepted positive `main`, prepare the recovery branch first. Its
   patch removes only the temporary failure step and fixture marker described
   below; do not merge it until the failed SHA is proven skipped.
2. On a separate negative-test branch, add one marker file and one `Validate`
   step whose failure expression is exactly the conjunction of
   `github.event_name == 'push'`, `github.ref == 'refs/heads/main'`, and the
   marker's presence. All ordinary validation commands remain unchanged and
   run before the fixture.
3. Open the negative pull request. Require its PR `Validate` run to execute all
   ordinary commands and succeed because the event is `pull_request`. Re-read
   the unchanged ruleset, then merge normally with no skip directive.
4. Capture the exact failed `main` push run and fixture step. Observe Railway's
   record for that same SHA transition through `WAITING` when observable and
   then `SKIPPED` for CI failure, including provider skipped-deployment detail.
   Prove no build, pre-deploy verifier, migration, or promotion ran for it.
   Require the prior positive deployment to remain active with passing
   readiness and smoke throughout.
5. Rebase or recreate the already-reviewed recovery patch on the failed
   `main`, open its pull request, require PR validation, and merge normally.
   Require the distinct recovery SHA to pass the push `Validate`, exact-SHA
   verifier, migration, deployment, readiness, smoke, structured-log
   correlation, metrics, identities, and clean IaC checks.

If the actual protected-branch or provider behavior cannot perform this exact
test safely, do not weaken policy. Record production negative acceptance as
unproven and keep the work item out of completion.

## Evidence and completion boundary

Append immutable execution evidence to a dated operations artifact. Include
PRs, runs, jobs, deployment IDs and URLs, full SHAs, UTC timestamps, terminal
statuses, redacted configuration read-backs, log ordering, smoke, metrics,
identity checks, the earlier bootstrap and first-link-deviation evidence, and
the static-variable retirement result. Never include the verifier token or
other secret values.

After all evidence and repository validation pass, transition only to
`implementation_review`. Because this is the final approved slice, a later
approved review must route to `human_gate / work_item_completion`; this plan
does not authorize terminal completion.
