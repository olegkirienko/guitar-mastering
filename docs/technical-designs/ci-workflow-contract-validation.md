# CI workflow contract validation

## Purpose

Make repository workflow-state validation an explicit part of the normal
GitHub `Validate` job so an invalid orchestration/control-plane state cannot
pass otherwise-green application validation.

This revision also repairs the v3.1 final-review/merge boundary exposed while
trying to approve this slice. Repository state must persist the exact
implementation content approved by review, but it must not try to persist the
SHA of the commit that contains that state. The merge candidate is therefore a
dynamic, approval-scoped observation derived from a stable `reviewed_sha`.

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
- Replace v3.1's self-referential persisted PR-head pin with a stable
  `reviewed_sha`, a narrowly defined post-review control-plane envelope, and an
  exact dynamically resolved merge candidate.
- Ensure any implementation or application change after `reviewed_sha`
  invalidates merge readiness and returns to reviewed workflow.

## Non-goals

- Rewriting completed historical workflow YAML or migrating the active legacy
  lesson workflow as a side effect of CI validation.
- Restoring files intentionally removed by completed work or requiring new
  tombstone artifacts solely to preserve their historical context references.
- Redesigning v3 phase, finding, reconciliation, delivery, or Git lifecycle
  semantics, or changing v3.1 behavior beyond the exact final-review and
  merge-approval correction defined below.
- Renaming or splitting the `validate` job, adding a workflow, changing
  branch-protection settings, or otherwise redesigning CI.
- Changing Railway configuration, pre-deploy verification, deployment
  sequencing, migrations, readiness, or smoke behavior.
- Adding dependencies, secrets, caches, service containers, or setup actions.
- Unrelated workflow, application, test, or documentation cleanup.
- Introducing an external gate record, approval service, second PR, or mutable
  approval ledger. The explicit human response remains the approval record
  unless design review finds repository state plus provider audit evidence
  insufficient.

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

## V3.1 reviewed revision and dynamic merge candidate

The existing v3.1 `git.head_sha` contract is impossible to satisfy at a
repository-resident merge gate: committing a workflow that contains the
current PR head necessarily creates a different PR head. The same defect would
remain if the head or its validation run were moved into persisted
`gate_scope`. V3.1 must instead use this Git block:

```yaml
git:
  repository: github.com/<owner>/<repository>
  branch: work/<work-item-id>
  lifecycle_generation: <uuid>
  lifecycle_anchor_sha: <full-bootstrap-commit-sha>
  pr_number: <number>
  reviewed_sha: <full-reviewed-implementation-sha-or-null>
  merged_sha: <full-main-sha-or-null>
```

`reviewed_sha` is the full commit SHA whose implementation content received an
`APPROVED` final implementation review or fix re-review. It is null before
such approval and whenever design, implementation, fixes, or a behavioral
re-review is active. The approving review names the same SHA. The subsequent
commit may add only that immutable review and the workflow transition that
records `reviewed_sha`; it does not change what was reviewed.

For this contract, the only approved pre-merge changes after `reviewed_sha`
are these control-plane paths for the same work item:

```text
docs/workflow/<work-item-id>.yaml
docs/reviews/<work-item-id>/implementation-review-*.md
docs/reviews/<work-item-id>/fix-rereview-*.md
```

Each intervening commit, not merely the aggregate diff, must be inspected.
Every changed path must match that allowlist, review artifacts must be new
immutable files, and workflow changes must be legal state transitions. A
rename, deletion, rewrite of prior evidence, mixed control-plane/application
commit, or change to any design, source, test, CI, configuration, dependency,
operation, or other implementation path is not merge-ready. Such a change
invalidates `reviewed_sha` and returns to `implementation_review`,
`fix_rereview`, or `design` according to its semantic effect; it cannot be
waived as gate metadata or reconciliation.

### Entering and presenting merge approval

The final approved v3.1 review transition persists stable scope only:

```yaml
phase: human_gate
status: awaiting_approval
gate: merge_approval
gate_scope:
  repository: github.com/<owner>/<repository>
  branch: work/<work-item-id>
  lifecycle_generation: <uuid>
  pr_number: <number>
  target_branch: main
  reviewed_sha: <full-reviewed-implementation-sha>
next:
  action: approve-merge
  on_approval:
    phase: delivery_verification
    action: verify-delivery
```

Before presenting that human gate, the orchestrator fetches the canonical work
ref and PR without trusting the checkout, resolves the current full PR head,
and proves:

1. repository, branch, lifecycle generation, PR, and `main` target match the
   persisted stable scope;
2. `reviewed_sha` is in the canonical branch and PR-head ancestry;
3. every commit in `reviewed_sha..current_pr_head` satisfies the exact
   control-plane rule above;
4. the tree is clean, no blocking finding is active, and the PR diff remains
   within the approved design;
5. required validation completed successfully for that exact current PR head;
   and
6. read-only GitHub evidence proves the chosen merge path retains the canonical
   work branch.

The human-facing approval request must present the exact dynamically resolved
PR head SHA, its successful validation run, `reviewed_sha`, PR and target,
control-plane-only lineage result, and retention proof. These are live gate
observations, not fields written back into the branch before merge.

### Consuming merge approval

Approval is scoped to the exact head and evidence presented in the immediately
preceding gate request. After approval and immediately before mutation, fetch
and re-resolve the canonical branch and PR. The current PR head must equal the
approved presented SHA byte-for-byte, still descend from `reviewed_sha`, still
have only allowed intervening commits, still own successful checks for that
head, and still satisfy retention proof. Any difference fails closed and
invalidates that approval; no merge occurs.

The protected merge operation must use GitHub's atomic expected-head facility
(`expectedHeadOid` or an equivalent provider primitive) with that unchanged
full SHA. If the provider cannot atomically bind the merge to the approved
head, merge fails closed. After success, resolve and record the exact resulting
full `main` SHA as `git.merged_sha`, leave `reviewed_sha` intact for audit, and
enter normal `delivery_verification`. The work branch then receives only the
already designed post-merge control-plane tail.

No external gate record is introduced. The canonical workflow stores stable
scope, immutable review stores the reviewed implementation SHA, Git/GitHub
provide commit and merge audit history, and the user's explicit response is
single-use authorization for the exact head shown. If a future review proves
that evidence insufficient, adding another record requires its own design and
approval rather than being inferred here.

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

The validator's own contract fixtures must additionally cover discovery,
declared-version dispatch, and the corrected v3.1 merge boundary. Add isolated
in-memory or temporary-directory cases
proving that lexical discovery includes a newly added workflow, templates are
excluded, duplicate identities fail, an invalid discovered active v3/v3.1
state fails, the current active v1 approval envelope passes, unsupported active
v2 fails, an active workflow with a missing context target fails, and supported
completed v1/v2/v3 states pass without rewriting them even when a historical
context target was intentionally removed. A completed workflow with a missing
authoritative design or immutable review must still fail. At least one negative
discovered-workflow case must assert a failing validator outcome and include
its path in the diagnostic. Replace `head_sha` state fixtures and templates
with `reviewed_sha`. Add transition/orchestration fixtures proving a
control-plane-only descendant is eligible, a non-descendant fails, every
implementation/application change after `reviewed_sha` forces review, a PR
head change after human presentation fails closed, an atomic merge is bound to
the unchanged presented head, and the resulting main SHA is recorded normally.

Update the v3.1 repository contract consistently in `AGENTS.md`,
`docs/workflow/README.md`, the work-orchestrator and implementation-review
skills, workflow templates, and the v3.1 lifecycle technical design. Completed
workflow YAML and immutable review artifacts remain untouched. Existing active
v3.1 states replace the unused `head_sha` key with `reviewed_sha` in the same
implementation checkpoint; no historical SHA is fabricated.

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
  order, startup, readiness, and smoke checks. Only the pre-merge approval pin
  changes; post-merge delivery still keys exclusively on `merged_sha`.
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
13. V3.1 state persists `reviewed_sha`, never the current pre-merge PR head or
    its validation-run identity; existing active v3.1 state and templates use
    the corrected field without rewriting completed workflows or reviews.
14. A merge candidate must descend from `reviewed_sha`, and every intervening
    commit must contain only the exact same-item workflow/new-review
    control-plane paths. Any implementation/application change invalidates
    merge readiness and requires review again.
15. The human merge request presents the exact dynamically resolved PR head
    and successful validation evidence. After approval, a changed head fails
    closed and the protected merge atomically requires the unchanged approved
    head.
16. Successful merge records the exact resulting full `main` SHA normally and
    proceeds through existing delivery verification. `reviewed_sha` remains
    audit evidence and does not replace `merged_sha`.
17. No external gate record, second PR, direct `main` push, provider setting,
    branch-protection, Railway, credential, or database change is introduced.

## Rollback

Before merge, revert the scoped CI, foundation-test, validator, contract,
skill, template, design, and active-workflow edits in the work-item PR. After
merge, a normal reviewed revert of those changes restores the prior pipeline
and contract; an item already merged under the corrected contract retains its
immutable Git/GitHub history and exact `merged_sha`. The validator never writes
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
   fixtures. Replace the v3.1 persisted `head_sha` model with the exact
   `reviewed_sha` and dynamic-head merge-gate contract in `AGENTS.md`, the
   v3.1 lifecycle technical design, workflow README/templates, relevant
   orchestration/review skills, validator state/transition/orchestration
   fixtures, and active v3.1 workflow state. Do not modify completed workflow
   YAML or immutable reviews, package/lock files, Railway behavior, or the
   post-merge exact-SHA verifier. Run the full acceptance command set above and
   record the result in workflow state before implementation review.
