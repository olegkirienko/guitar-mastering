# Implementation Review 07 — GitHub main validation

## Review metadata

- **Work item:** `railway-ci-cd-iac`
- **Type:** `infrastructure`
- **Slice:** `github-main-validation`
- **Authoritative design:** `docs/technical-designs/railway-ci-cd-iac.md`
- **Implementation evidence:**
  `docs/operations/github-main-validation-plan.md`
- **HEAD reviewed:** `cdda5ce4a6d3909baf25f99dd0edd9b351f0dd93`
- **Date:** 2026-09-21
- **Verdict:** `CHANGES REQUIRED`

## Preflight and scope

`PREFLIGHT PASSED`. The workflow state identifies the approved design, routes
canonically to `implementation_review`, names the implemented
`github-main-validation` slice, has no gate or active finding, and references
artifacts that exist. The authoritative design contains three later approved
slices, beginning with `deployment-metadata-and-runbook`; this is not the final
slice.

This review covers only the GitHub validation trigger, branch policy, exact-SHA
evidence, repository visibility decision, scope boundary, and validation. It
does not authorize a Railway source connection, Wait for CI, autodeploy,
secret, deployment, migration, IaC apply, or any later-slice implementation.

## Assessment

The functional implementation satisfies the current slice's CI and policy
requirements. `Validate` retains its unconditional pull-request trigger and
adds only `push` on `main`; manual dispatch is absent. The sole `validate` job
keeps every approved validation step, PostgreSQL 17 service, minimal
`contents: read` permission, and no path filter, job condition, concurrency
cancellation, deployment, migration, or IaC action. Repository acceptance
coverage protects the trigger and validation-only invariants.

GitHub read-back on 2026-09-21 showed the repository public, only `Validate`
active, and GitHub Pages absent. Ruleset `23761397` is active on the default
branch and requires pull requests, resolved conversations, and the strict
GitHub Actions `validate` context. It blocks deletion and non-fast-forward
updates, has no bypass actor, and reports `current_user_can_bypass: never`.
The repository has only its owner as collaborator, so zero required approving
reviews is consistent with the design's repository-ownership capability
exception; one approval would make the owner's own PR impossible to merge.

PR 1 passed `Validate` before merge. Its merge commit
`3e933bdb80eff22cb4edd5ab132dd979dea901cb` then passed a separate `push`
run. The final reviewed `main` commit
`cdda5ce4a6d3909baf25f99dd0edd9b351f0dd93` independently passed push run
`35588063453`; its install, lint/typecheck, unit/foundation, browser,
PostgreSQL, and production-build steps all concluded `success`. No additional
check producer appeared, so the no-cancellation-risk inventory is satisfied.

The current tree tracks only `.env.example` among secret-like filenames. A
bounded current-tree and Git-history scan found no GitHub token, Railway token,
or private-key marker. This is supporting review evidence, not a general
guarantee that public visibility is risk-free.

## Blocking finding

### MEDIUM-02 — The authoritative design still depends on the superseded private-repository state

The authoritative design's current status still says targeted re-review is
pending and no later slice is authorized. Its observed baseline still says
`Validate` uses `workflow_dispatch`, and its credential design says a
`GITHUB_ACTIONS_READ_TOKEN` is required because the repository is private.
The implemented and live state is now the opposite: slice 2 is complete,
manual dispatch is removed, the repository is public, and anonymous Actions
API access may change whether the future production credential is necessary.
The operator record also labels the pre-activation SHA as `Current remote
main`, although the execution section later records a newer accepted SHA.

This is material design drift rather than harmless historical wording. A later
operator following the authoritative design could provision and preserve an
unnecessary production secret, or treat the completed CI slice as
unauthorized. The public visibility choice also changed the threat and privacy
boundary without a reviewed decision about the future verifier's
authentication mode.

Targeted fix: change only documentation and workflow state for `MEDIUM-02`.
Update the authoritative design's current status, current GitHub baseline, and
slice/routing statements to record the implemented `github-main-validation`
slice and public repository. Do not silently replace the approved future token
design: explicitly mark the verifier credential choice as requiring a narrow
design amendment and review before `railway-github-autodeploy` begins. Clarify
the operator record's old SHA as the pre-activation baseline. Preserve dated
historical evidence. Make no application, workflow, IaC, dependency, GitHub
setting, secret, or Railway change.

## Validation

- Final GitHub `main` SHA —
  `cdda5ce4a6d3909baf25f99dd0edd9b351f0dd93`.
- Final `push` `Validate` run `35588063453` — passed; sole job and all required
  steps succeeded.
- Active workflow inventory — only `Validate`.
- Ruleset `23761397` and effective `main` rules read-back — passed.
- GitHub Pages read — absent (`404`).
- Collaborator/capability read — sole owner confirmed.
- Bounded current-tree and Git-history secret-marker scan — no match.
- Node 24.7.0 local validation recorded by implementation: lint, 55 unit tests,
  10 browser tests, 19 PostgreSQL tests, production build, and diff check
  passed.
- `git diff --check` — passed before this review artifact/state transition.
- No Railway command or provider mutation was executed during review.

## Verdict and transition

**Verdict: `CHANGES REQUIRED`**

Route to `fixes` with only `MEDIUM-02` active. The CI workflow, live ruleset,
and exact-SHA validation are otherwise accepted. The targeted fix is
documentation/state-only and must not change application code, GitHub policy,
repository visibility, IaC, secrets, or Railway state. After it, run
`fix_rereview` against `MEDIUM-02` only.
