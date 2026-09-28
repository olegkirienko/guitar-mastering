# CI workflow contract validation

## Purpose

Make repository workflow-state validation an explicit part of the normal
GitHub `Validate` job so an invalid orchestration/control-plane state cannot
pass otherwise-green application validation.

The existing `pnpm validate:workflow` command remains the public entry point.
Its state-machine fixtures remain intact, but its repository boundary must be
extended from a hard-coded pair of workflow files to deterministic discovery
and declared-version validation of every direct `docs/workflow/*.yaml` file.

## Goals

- Run `pnpm validate:workflow` on every pull request and every push to `main`
  through the existing `Validate` workflow.
- Discover every direct workflow-state YAML under `docs/workflow/` without a
  manually maintained allowlist and validate it under its declared version.
- Validate active v3/v3.1 state with the current state-machine contract,
  preserve completed v1/v2/v3 snapshots under their historical contract, and
  validate the current active v1 compatibility gate without rewriting it.
- Fail closed with a path-specific diagnostic when a discovered workflow has
  an unsupported version/state, invalid route, duplicate identity, or missing
  authoritative design/review evidence. Every referenced context path of an
  active/non-terminal workflow must also exist.
- Make validator failure fail the existing `validate` job and therefore the
  existing required `Validate / validate` check.
- Run the check early enough to stop expensive application, browser, database,
  and build work when the workflow contract is invalid.
- Preserve the current CI triggers, job identity, service topology, application
  checks, and production-delivery contract.

## Non-goals

- Rewriting completed historical workflow YAML or migrating the active legacy
  lesson workflow as a side effect of CI validation.
- Restoring files intentionally removed by completed work or requiring new
  tombstone artifacts solely to preserve their historical context references.
- Redesigning v3/v3.1 phase, gate, finding, reconciliation, delivery, or Git
  lifecycle semantics beyond applying the existing validator to discovered
  repository states.
- Renaming or splitting the `validate` job, adding a workflow, changing
  branch-protection settings, or otherwise redesigning CI.
- Changing Railway configuration, pre-deploy verification, deployment
  sequencing, migrations, readiness, or smoke behavior.
- Adding dependencies, secrets, caches, service containers, or setup actions.
- Unrelated workflow, application, test, or documentation cleanup.

## Current contract and compatibility

`.github/workflows/ci.yml` has one `validate` job. It checks out the repository,
sets up pnpm 11.9.0 and the Node version from `.nvmrc`, installs the frozen
lockfile, then runs lint/typecheck, unit tests, browser tests, PostgreSQL
integration tests, and the production build.

`package.json` already defines:

```text
validate:workflow = node scripts/validate-workflow-contract.mjs
```

The validator imports only Node built-ins and reads repository files. Its
contract checks and fixtures execute inside that script. It does not require a
database, browser, network, secret, environment variable, generated artifact,
or third-party runtime package. The command therefore has all required runtime
support once the existing Node and pnpm setup has completed; no dependency or
lockfile change is needed.

The current repository boundary is incomplete. The script validates extensive
in-memory state/transition fixtures, reads the completed v3 installer workflow,
and then hard-codes only two completed v3 workflow paths. It does not discover
or read the active `ci-workflow-contract-validation.yaml` state carried by this
work item, and it omits the active historical `stage-01-lesson-02.yaml` state.
Adding the command to CI without correcting that boundary would not achieve
the stated fail-closed goal.

The production exact-SHA verifier in `server/verify-ci.ts` already requires a
successful completed `Validate` workflow run and successful `validate` job.
Consequently, a failed workflow-contract step prevents the run and job success
that Railway accepts. The verifier additionally checks a stable subset of the
existing application steps and permits extra successful steps, so neither it
nor its tests need to change. Keeping its required-step list unchanged avoids
altering Railway behavior while preserving the stronger overall CI gate.

## Repository discovery and declared-version validation

At startup, enumerate direct entries of `docs/workflow/`, retain regular files
whose names end in `.yaml`, and sort their repository-relative paths
lexicographically before validation. Direct-file discovery intentionally
excludes `docs/workflow/templates/` without a name allowlist. An unreadable
entry, duplicate identity, malformed required scalar, unsupported version, or
validation failure must identify the workflow path and make the command exit
nonzero.

Apply these adapters:

- **v3 and v3.1:** parse with the existing v3 parser and run the existing
  `validateState` contract. Always validate the authoritative design path and
  latest review when non-null. For non-terminal states, additionally require
  every context path and blocking-finding source to exist. For terminal states,
  context entries remain well-formed historical references but are not
  existence requirements. This is static repository validation; remote ref,
  tag, PR, CI, and provider observations remain orchestration preflight
  responsibilities.
- **completed v1/v2:** preserve the historical files unchanged and validate
  their compatibility envelope: declared version and identity, exact
  `complete / complete / none` terminal route, approved current slice and
  latest review, empty blocking findings, and terminal `next` action. Require
  the authoritative specification/design, latest immutable review, and every
  completed-slice final review to exist. Context, course-map, previous-work,
  and other historical reference values must remain non-empty repository
  paths, but their current targets may be absent when completed work removed
  them. Do not reinterpret duplicate historical status/verdict fields as v3
  authority or make completed workflows executable.
- **active v1:** accept only the repository's declared historical approval
  envelope: lesson identity, `human_gate / approved / design_approval`, empty
  findings, approved design review, and the explicit
  `implementation / begin-approved-implementation / human_approval_required`
  destination. Validate its specification, course-map, previous-lesson, and
  review references. Any other active v1 shape fails closed pending migration
  or an explicit compatibility design.
- **active v2:** fail closed with an actionable unsupported-active-legacy
  diagnostic. None exists in the repository; an active v2 item must be
  explicitly migrated or given a reviewed compatibility contract rather than
  silently accepted.

Identity keys must be unique across discovered files (`lesson_id` for v1,
`work_item_id` otherwise). Compatibility adapters are intentionally smaller
than the v3 state machine: they preserve known historical validity without
creating new executable legacy routes. Phase is evaluated before artifact
existence: only a validated exact terminal envelope receives the historical
context exception. A malformed or merely claimed terminal state does not.

This policy deliberately distinguishes authoritative evidence from historical
inputs. Workflow files are present because discovery reads them; their
specification/design and immutable approval/final-review artifacts remain
durable evidence and must exist. Context lists describe inputs that were valid
while work executed and may name the very resources a completed retirement
removed. Treating those paths as historical only after terminal validation
preserves audit history without restoring retired files or maintaining a
separate tombstone registry.

## CI placement and ordering

Add one explicit step to the existing `validate` job:

```yaml
- name: Validate workflow contracts
  run: pnpm validate:workflow
```

Place it immediately after `Install dependencies` and immediately before
`Lint and typecheck`. The resulting conceptual order is:

```text
checkout
→ pnpm setup
→ Node setup
→ frozen install
→ workflow contract validation
→ lint/typecheck
→ unit tests
→ browser tests
→ PostgreSQL integration tests
→ production build
```

Running after installation keeps every repository command behind the existing
single dependency/bootstrap boundary and uses the same configured Node/pnpm
environment as the rest of the job. Running before lint/typecheck prioritizes
the fast control-plane check and avoids spending CI time on downstream checks
when orchestration state is invalid.

Do not add `continue-on-error`, conditions, retries, or failure suppression.
The command's nonzero exit must fail the step, stop later steps under GitHub
Actions' default success condition, and fail the existing job/check. Success
must leave all later validation behavior unchanged.

## Test and documentation impact

The existing CI-focused assertion in `build/foundation.acceptance.test.ts`
must prove that `.github/workflows/ci.yml` invokes
`pnpm validate:workflow` exactly once and places it after
`pnpm install --frozen-lockfile` and before `pnpm lint`.

The validator's own contract fixtures must additionally cover discovery and
declared-version dispatch. Add isolated in-memory or temporary-directory cases
proving that lexical discovery includes a newly added workflow, templates are
excluded, duplicate identities fail, an invalid discovered active v3/v3.1
state fails, the current active v1 approval envelope passes, unsupported active
v2 fails, an active workflow with a missing context target fails, and supported
completed v1/v2/v3 states pass without rewriting them even when a historical
context target was intentionally removed. A completed workflow with a missing
authoritative design or immutable review must still fail. At least one negative
discovered-workflow case must assert a failing validator outcome and include
its path in the diagnostic.

No new test framework is warranted. The exact-SHA Railway verifier tests also
require no change because the verifier continues to accept extra steps and
still rejects any unsuccessful job. No README, operator runbook, or deployment
documentation needs an update; the CI YAML, validator, this design, and
workflow state provide the executable behavior and durable rationale.

## Infrastructure, security, and operations

- **Topology and environments:** retain the single GitHub-hosted `validate` job
  and its existing PostgreSQL service. No environment is added or changed.
- **Secrets and permissions:** retain `contents: read`; discovery is confined
  to repository files and needs no token, secret, write permission, or external
  service.
- **Deployment semantics:** retain workflow triggers, job/check identity,
  Railway Wait for CI behavior, exact-SHA pre-deploy verification, migration
  order, startup, readiness, and smoke checks.
- **Observability:** failures name the discovered workflow path and contract
  reason in the existing step log; no additional telemetry is needed.
- **Cost and limits:** direct-file discovery and local validation add negligible
  runner time and no service or storage cost.
- **Failure mode:** invalid/unsupported state, missing evidence, discovery or
  parser error, or validator process error fails closed as a red
  `Validate / validate` check. A GitHub runner outage remains a CI availability
  issue and does not justify bypassing the step.

## Acceptance criteria

1. `pnpm validate:workflow` deterministically discovers every direct
   `docs/workflow/*.yaml` state without a hard-coded file allowlist and excludes
   the templates subdirectory.
2. Every discovered workflow is dispatched by declared version, identities are
   unique, supported active states and completed compatibility states validate,
   and unsupported or malformed states fail closed with a path-specific error.
3. The current v3.1 work item and active v1 lesson workflow are both validated;
   completed v1/v2/v3 historical snapshots remain unchanged and valid.
4. Every workflow's authoritative design/specification and immutable latest
   and completed-slice final reviews exist. Every context/finding reference of
   an active workflow exists. A completed workflow may retain a well-formed
   historical context reference whose target was removed by completed work,
   remains non-executable, and needs no restored file or tombstone artifact.
5. The existing `validate` job contains exactly one step named
   `Validate workflow contracts` whose command is exactly
   `pnpm validate:workflow`.
6. The step is after the frozen dependency install and before lint/typecheck.
7. The step has no condition, retry, or `continue-on-error` behavior and a
   nonzero validator exit fails the existing job/check.
8. Existing triggers, permissions, job name, PostgreSQL service, application
   validation steps, and production build step remain unchanged.
9. `package.json`, the lockfile, Railway configuration, exact-SHA verifier, and
   verifier tests remain unchanged.
10. The validator contains regression coverage for discovery, version routing,
    current repository states, referenced artifacts, and fail-closed behavior.
11. The foundation acceptance test covers presence, uniqueness, and ordering
    of the command.
12. `pnpm validate:workflow`, `pnpm lint`, `pnpm test`,
    `pnpm test:browser`, `pnpm test:postgres`, `pnpm build`, and
    `git diff --check` pass under the repository's configured Node version.

## Rollback

Before merge, revert the scoped CI, foundation-test, and validator edits in the
work-item PR. After merge, a normal reviewed revert of those three changes
restores the prior pipeline and validator boundary. The validator never writes
workflow state, and no data, credential, provider, Railway, or database
rollback is involved.

## Approved implementation slice

1. **`ci-required-workflow-validation` — require real repository workflow-state
   validation in GitHub CI.** Preserve the already implemented named CI step
   and focused presence/uniqueness/ordering assertions. Extend
   `scripts/validate-workflow-contract.mjs` with deterministic direct-file
   discovery, unique identity checks, the existing v3/v3.1 validator path,
   bounded v1/v2 compatibility adapters, phase-aware authoritative/context
   artifact validation, and the specified positive/negative regression
   fixtures. Do not modify
   historical workflow YAML, package/lock files, Railway behavior, or the
   exact-SHA verifier. Run the full acceptance command set above and record the
   result in workflow state before implementation review.
