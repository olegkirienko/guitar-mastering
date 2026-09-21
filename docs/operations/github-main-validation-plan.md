# GitHub main validation: policy and activation plan

**Work item:** `railway-ci-cd-iac`  
**Slice:** `github-main-validation`  
**Prepared:** 2026-09-21  
**Status:** implemented and verified on 2026-09-21.

## Target and read-only baseline

- Repository: public `olegkirienko/guitar-mastering`; default branch `main`.
- Authenticated operator: `olegkirienko`, repository permission `ADMIN`.
- Active workflows: only `.github/workflows/ci.yml`, named `Validate`.
- Current remote `main`: `1d95822ceafb5901199247df26e53112c7bee4d9`.
- The latest `Validate` run on that SHA was a successful manual
  `workflow_dispatch` run, not a `push` run:
  `https://github.com/olegkirienko/guitar-mastering/actions/runs/35444229616`.
- The repository contains no locally active workflow other than `Validate`.
  Historical `main` runs from the retired GitHub Pages workflow remain as audit
  history but cannot produce new checks.
- Before the visibility change, read-only requests for repository rulesets and
  classic `main` branch protection returned HTTP 403. After the owner made the
  repository public, ruleset reads succeeded; no ruleset or classic protection
  was present before activation.
- The repository has one collaborator, owner `olegkirienko`, with admin access.
  There is no second human who can approve the owner's pull request.

## Implemented repository change

The existing `Validate` workflow now retains its unconditional `pull_request`
trigger and adds an unconditional `push` trigger restricted to `main`.
`workflow_dispatch` is removed. The workflow still has one `validate` job, no
path filters, no job-level condition, no concurrency cancellation, minimal
`contents: read` permission, the PostgreSQL 17 service, and every existing
validation step. It remains validation-only and contains no deployment,
Railway, migration, or IaC apply action.

Repository acceptance coverage asserts the `pull_request` plus `push/main`
trigger shape, absence of manual dispatch and concurrency, production build,
and absence of the retired Pages and Cloudflare deployment commands.

## Capability decision

The owner selected the public-repository capability path and explicitly
approved activation on 2026-09-21. The ruleset therefore requires pull requests
but uses zero required approving reviews: with only the PR author as a
collaborator, requiring one approval would make compliant merge impossible.
Resolved conversations, the strict `validate` check, deletion and force-push
protection, and no administrator bypass remain required. This is the approved
design's repository-ownership capability exception, not a claim that a second
human review occurred.

## Reviewed remote policy mutation

After capability exists, obtain separate explicit operator approval for the
exact settings below. Re-read current rules, collaborators, enabled workflows,
GitHub Apps/check producers, and the successful `validate` check context before
mutation. Stop on any unexpected workflow or integration.

Apply a `main`-scoped ruleset or equivalent protection that:

- requires pull requests; the current single-owner repository uses zero required
  approvals until a second eligible human collaborator exists;
- requires all review conversations to be resolved;
- requires the unique `validate` check produced by `Validate`;
- requires the branch to be current before merge;
- blocks force pushes and branch deletion;
- prevents direct pushes and administrator bypass to the extent supported by
  the chosen plan and repository ownership model; and
- does not enable merge queue, because `Validate` has no reviewed
  `merge_group` trigger.

Read the effective rule back after mutation. Preserve the pre-change response
as the rollback record. If the required `validate` context is ambiguous or the
rule would lock out the owner without a reviewed recovery path, stop before
activation.

## Activation and exact-SHA acceptance

The local workflow change must reach `main` through a reviewed repository
change; this plan does not authorize a direct push, merge, or policy bypass.
For the resulting `main` commit, require an actual `push`-event `Validate` run
whose `head_branch` is `main`, whose full `head_sha` equals the merged commit,
and whose conclusion is `success`. Record the full SHA, workflow-run URL, job
and step conclusions, and UTC completion time. A manual run, skipped step,
neutral/cancelled conclusion, or different SHA is not acceptance.

Re-read the workflow inventory and effective branch rules after activation.
No Railway source connection, Wait for CI setting, autodeploy setting, secret,
deployment, migration, or IaC apply is permitted in this slice.

## Rollback and stop conditions

If the new workflow syntax fails, revert only its trigger change through the
same reviewed repository process. If branch policy blocks legitimate recovery,
use the preserved pre-change settings and the narrowest supported administrator
recovery, then re-read the effective rules. Stop for renewed review on an
unexpected check producer, ambiguous required-check context, missing `push`
run, failed validation, direct-push requirement, or any proposed Railway
mutation.

## Execution evidence — 2026-09-21

The owner made `olegkirienko/guitar-mastering` public and explicitly approved
the reviewed policy activation. Pull request
`https://github.com/olegkirienko/guitar-mastering/pull/1` carried the repository
change. Its `Validate` pull-request run `35586604121` completed successfully
before policy activation and merge.

Repository ruleset `23761397` (`Protect main validation`) is active for the
default branch. Read-back shows pull requests required, zero required approving
reviews under the documented single-owner exception, required conversation
resolution, strict required GitHub Actions context `validate` with integration
ID `15368`, deletion and non-fast-forward protection, no bypass actors, and
`current_user_can_bypass: never`. Merge queue is not enabled.

PR 1 merged through that ruleset at `2026-09-21T10:08:46Z`, producing exact
`main` SHA `3e933bdb80eff22cb4edd5ab132dd979dea901cb`. The separate `push`-event
`Validate` run `35587159315` for that full SHA completed successfully at
`2026-09-21T10:10:11Z`:
`https://github.com/olegkirienko/guitar-mastering/actions/runs/35587159315`.
Its sole job was `validate`; install, lint/typecheck, unit/foundation, browser,
PostgreSQL, and production-build steps all concluded `success`.

Final inventory found exactly one active workflow, `Validate`, and exactly one
check on the accepted `main` SHA, GitHub Actions context `validate`. The
workflow has no path filters, conditions, manual dispatch, or concurrency
cancellation. No Railway source, Wait for CI, autodeploy, secret, deployment,
migration, or IaC setting was changed in this slice.
