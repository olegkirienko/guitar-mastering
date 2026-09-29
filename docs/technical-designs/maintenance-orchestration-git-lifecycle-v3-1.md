# Maintenance Orchestration Git Lifecycle v3.1

**Work item:** `maintenance-orchestration-git-lifecycle-v3-1` (`maintenance`)

## Goal

Extend the repository-local v3 orchestration contract with a small, explicit
Git/GitHub delivery lifecycle. A work item is not complete when implementation
passes review: its exact reviewed revision must be merged through the protected
`main` branch, delivered by the existing GitHub/Railway pipeline, positively
verified in production, and then explicitly accepted at the completion gate.

The extension is named **v3.1**. It preserves the v3 single-source-of-truth
model and adds only the state and policy needed to make repository delivery
auditable and fail closed.

## Non-goals

- Do not change application behavior, database schema, Railway resources,
  credentials, branch protection, or production configuration merely to adopt
  this contract. Repository retention settings are a precondition: if read-only
  proof cannot show that the selected merge path retains the work branch, merge
  fails closed until a separately reviewed settings change or recovery policy is
  approved.
- Do not repeat the exceptional bootstrap and negative-test complexity of
  `railway-ci-cd-iac` for ordinary work items.
- Do not require a commit for every orchestration phase or create empty commits
  except for an explicitly designed delivery acceptance test.
- Do not create multiple implementation PRs for ordinary phases of one work
  item.
- Do not route transient provider incidents or evidence wording through full
  design review unless architecture, behavior, scope, or accepted risk changes.
- Do not rewrite completed v1, v2, or v3 workflows or their immutable evidence.

## Preserved v3 invariants

1. For an initialized v3.1 item,
   `docs/workflow/<work-item-id>.yaml` on the resolved canonical work branch
   remains the only mutable authority for current phase, status, gate, active
   findings, and next action. A copy on `main` or any other ref is not executable
   routing state. Earlier contracts retain their declared authority rules.
2. Designs own durable decisions and slices; reviews and delivery evidence are
   immutable snapshots. None is a competing current-status ledger.
3. Reviews retain stable finding IDs and semantic classifications. Ambiguity
   fails closed.
4. Human approval is scoped, single-use, and non-transitive.
5. Completed historical workflows remain valid under their declared contract.
6. Production, destructive, and credential mutations retain the existing v3
   typed gates. Git lifecycle automation does not weaken them.

## Retrospective basis

`railway-ci-cd-iac` proved the production invariant that matters here:

`main` push → GitHub `Validate` → Railway `WAITING` → successful CI → exact-SHA
pre-deploy verification → migration → startup/readiness → production smoke.

It also proved globally that failed `main` CI produces a Railway `SKIPPED`
deployment and that an exact-SHA verifier failure prevents migration. Ordinary
work items therefore require only positive delivery verification. A new
negative test is required only when the approved work item changes CI/CD,
verification, migration ordering, or the failure-path invariant itself.

## Contract version and activation boundary

Validators select exact rules by the declared version; `3` and `3.1` are
distinct contract versions, not a numeric range. V3.1 becomes eligible only
when the v3.1 contract is present on the canonical `main` repository state
after this legacy installer work item completes its existing v3 delivery
procedure. Work-item creation before that semantic activation boundary remains
governed by the contract then installed on canonical `main`.

This maintenance item was created under v3 and remains v3 through its terminal
completion. Its current workflow is a legitimate v3 workflow. It must not be
retroactively assigned a canonical work branch, lifecycle generation,
lifecycle anchor, PR identity, or v3.1 delivery identity, and it is not required
to exercise the lifecycle it installs. Its final approved slice follows the v3
`work_item_completion` route and the repository's existing delivery procedure;
the mere presence of proposed v3.1 files in a working tree does not activate
v3.1.

After activation, brand-new work items use `version: 3.1`. Active pre-existing
v3 items remain v3 by default and may migrate only through a separately
designed, explicitly requested migration path that proves compatible identity
without fabricating history. No installation, validation, or resume action may
auto-migrate them. Completed historical workflows and immutable evidence remain
untouched.

## Canonical v3.1 state

V3.1 adds one minimal Git identity block:

```yaml
version: 3.1

git:
  repository: github.com/<owner>/<repository>
  branch: work/<work-item-id>
  lifecycle_generation: <uuid>
  lifecycle_anchor_sha: <full-bootstrap-commit-sha>
  pr_number: null
  reviewed_sha: null
  merged_sha: null
```

- `repository` is the normalized, immutable repository identity verified from
  the configured remote, not merely a remote alias or local directory name.
- `branch` is deterministic and immutable for the normal work-item lifecycle.
- `lifecycle_generation` is a freshly generated immutable UUID for this one
  initialization. A work-item ID is not reusable after completion; the
  generation, once verified against its lifecycle registration, distinguishes a
  valid resume from a stale or recreated ref and must never be copied into a new
  work item.
- `lifecycle_anchor_sha` is the full bootstrap commit SHA independently
  registered by the remote lifecycle tag. The YAML value is only a claim until
  it matches that registration and the bootstrap commit's identity bindings.
- `pr_number` is the one primary PR targeting `main`; it becomes non-null when
  the first meaningful checkpoint is pushed.
- `reviewed_sha` is the exact implementation revision approved by the final
  implementation review or fix re-review. It is null until such approval and
  whenever implementation/application behavior returns to review. It is never
  the current merge-gate PR head, `HEAD`, or a short SHA.
- `merged_sha` is null until the primary PR is merged, then records the exact
  resulting full SHA on `main`. It is not overwritten by a Railway deployment
  ID or a later local state-only commit.

The block contains identifiers, not duplicated status text. Current Git routing
still comes from top-level `phase`, `status`, `gate`, and `next.action`.

Delivery evidence is an immutable repository artifact under
`docs/delivery-evidence/<work-item-id>/delivery-XX.md`. The workflow may point to
it without copying its observations:

```yaml
delivery:
  evidence_path: null
```

`evidence_path` remains null until a conclusive attempt is recorded. It is not
a verdict or current-state field.

### Canonical ref lifetime

A tracked YAML file cannot truthfully advance after its own PR merges while
also remaining in that already merged PR. Creating a normal second PR would
violate the one-PR rule and, because every `main` push currently autodeploys,
would recursively create another delivery to verify.

V3.1 therefore designates `work/<work-item-id>` as the canonical executable
control-plane ref from successful initialization until terminal work-item
completion. Before merge, the branch and Draft PR carry all state. After the
primary PR merges, the same branch is retained and receives only meaningful
control-plane checkpoints: entry to delivery verification, verified-delivery
evidence/completion gate, and terminal completion. The merged PR remains the
single GitHub integration point and links the retained head ref. No second PR
or direct `main` push is created. `main` contains only the merge-time snapshot.

The branch MUST NOT be deleted, automatically or manually, while the workflow
is non-terminal. Before `merge_approval` is offered and again immediately
before merge, read-only GitHub evidence must prove that the selected merge path
will not auto-delete the head branch. Missing proof, an enabled auto-delete
path, or any cleanup policy that can delete the branch blocks merge. All
orchestration cleanup commands and automation must reject deletion of a branch
whose canonical workflow is not terminal.

`work_item_completion` approval is consumed on the work branch, and the exact
terminal YAML must be committed and pushed there before the branch becomes
eligible for deletion. That terminal commit converts the workflow into
immutable, non-executable history. Afterward the branch is no longer required
for routing: retaining it is allowed but it can never be resumed, migrated, or
made executable again; deleting it is allowed but not required. A deletion is
a separately approved destructive cleanup that records the terminal commit
SHA, lifecycle generation, primary/remediation PRs, and recovery evidence.
GitHub PR, review, and commit history are the durable audit trail after
deletion. Neither a retained completed branch nor any historical copy can be
used to initialize or resume work.

This branch-resident tail is intentionally limited to workflow state and
delivery evidence. Application, configuration, design, or implementation fixes
after merge require the exceptional remediation route below. If the canonical
branch disappears before terminal completion, execution fails closed. The
orchestrator must not read or continue from `main`; only explicit reconciliation
may restore the exact canonical ref after proving repository identity,
lifecycle generation, last pushed branch SHA, PR history, and commit ancestry.
If that proof is incomplete or the exact ref cannot be restored, the work item
remains blocked for explicit recovery direction.

### Lifecycle registration and executable-ref resolution

V3.1 uses an annotated Git tag in the reserved namespace
`refs/tags/orchestration/<work-item-id>/<generation>` as the independent,
immutable lifecycle registration. This is the smallest Git-native mechanism
that survives canonical branch deletion, can be fetched and resolved without
trusting workflow YAML, and points at an immutable bootstrap commit. No other
orchestration use may write this namespace. Moving, replacing, or deleting a
lifecycle tag is forbidden; a missing or changed remote registration fails
closed rather than authorizing recreation.

The bootstrap commit contains the initial workflow identity binding the
normalized repository, requested work-item ID, deterministic
`work/<work-item-id>` branch, and freshly generated opaque lifecycle generation.
The annotated tag name binds the ID and generation, its annotation repeats the
repository/ID/branch/generation tuple, and its target binds the bootstrap SHA.
Subsequent workflow state records `lifecycle_anchor_sha`, but that field and
every other YAML identity field are claims only. They acquire authority only
after verification against the fetched remote tag, its annotation, and the
identity stored in its target commit. Mutable phase, status, gate, findings,
and next action remain solely in workflow YAML; the tag is provenance metadata,
not routing state.

Resume is a ref-qualified operation distinct from initialization. For every
already-initialized v3.1 item, the resolver must, in order:

1. normalize the requested repository and fetch/prune the exact canonical work
   ref plus all lifecycle tags for the requested work-item ID;
2. require `refs/remotes/origin/work/<work-item-id>` and exactly one lifecycle
   registration for that ID; missing or multiple registrations fail closed;
3. resolve the annotated tag to its bootstrap commit and read the bootstrap
   workflow identity from that commit without trusting the current checkout;
4. verify the requested repository and ID, deterministic branch, generation,
   tag namespace, and bootstrap binding all agree;
5. verify the bootstrap commit is an ancestor of the fetched canonical work
   ref;
6. read the current workflow directly from that fetched work ref and verify its
   repository, ID, branch, generation, and `lifecycle_anchor_sha` claims against
   the authoritative registration;
7. verify ref/PR ancestry and available branch metadata agree with
   `git.reviewed_sha`, `git.merged_sha`, and the workflow's canonical Git
   metadata; when `reviewed_sha` is non-null, require it in current canonical
   branch and PR ancestry without requiring it to equal the current head;
8. reject copied workflows on any other ref and reject a terminal workflow
   before checkout or action dispatch; and
9. only then check out or execute the single `next.action` from that ref.

A failed resume never falls back to initialization, `main`, the current
checkout, another branch, another tag, or Git history. The existence of a
canonical branch or any lifecycle registration for the requested ID makes a
fresh-initialization request invalid. Likewise, absence of the canonical branch
or registration during resume is corruption/recovery territory, not evidence
that the ID is new.

Copies on `main`, later work branches, merge commits, unrelated tags, or Git
history are historical application-tree content only. They are ignored as
executable state even when their phase appears active. A second ref that
independently claims the same work-item ID or lifecycle generation with
conflicting repository, canonical-branch, generation, or ancestry metadata is
an identity ambiguity and fails closed; the resolver must not choose the newest,
current, or `main` copy. An inherited snapshot whose embedded canonical branch
still points to the original work branch is not a second authority and cannot
route from the inheriting ref. Completed identities are permanently tombstoned
by their lifecycle registration plus terminal commit/PR history and never
become executable merely because a file or retained branch still exists. The
lifecycle tag remains immutable audit history even if a completed canonical
branch is later deleted.

## State machine

V3.1 adds `work_item_init` and `delivery_verification` to the v3 phase set.

| Phase | Legal action family | Normal successful destination |
| --- | --- | --- |
| `work_item_init` | `initialize-work-item` | `design` |
| `design` | `create-or-revise-design` | `design_review` |
| `design_review` | `review-design` | design approval, reconciliation, or `design` |
| `implementation` | `implement-<slice>` | `implementation_review` or a pinned risky-action gate |
| `implementation_review` | `review-<slice>` | next-slice gate, final merge gate, fixes, reconciliation, or `design` |
| `fixes` | `fix-<finding-ids>` | `fix_rereview` |
| `fix_rereview` | `rereview-<slice>` | next-slice gate, final merge gate, fixes, or reconciliation |
| `reconciliation` | `reconcile-<id>` | exact `next.on_success` destination |
| `human_gate` | `approve-<gate>` | exact scoped destination/procedure |
| `delivery_verification` | `verify-delivery` or `retry-delivery-<id>` | completion gate, fixes, or reconciliation |
| `complete` | `none` | terminal |

When a prior review returns one or more `design_defect` findings, those finding
records remain active while the design is revised and while the revised design
is presented at `design_review / review-design`. The targeted design review is
the authority that resolves, retains, or supersedes them; merely transitioning
from `design` to `design_review` must not remove them. Validation must therefore
accept active design findings in both of those phases and reject them from any
implementation, merge, delivery, or completion route until review resolves
them and the resulting design approval is explicitly consumed.

The normal path is:

`work_item_init → design → design_review → design_approval → implementation ↔ review/fixes → merge_approval → delivery_verification → work_item_completion → complete`

`reconciliation` remains the bounded escape path. No `merge` phase is added:
consuming `merge_approval` performs the pinned merge procedure and installs
`delivery_verification` only after the exact `main` SHA is known.

### Distinct milestones

- **Implementation complete:** the final approved slice has no active finding.
- **Merge ready:** the exact final head is clean, pushed, represented by the
  primary PR, and all required PR checks pass; `merge_approval` is current.
- **Delivery complete:** the exact `merged_sha` has positive end-to-end evidence.
- **Work item complete:** delivery is complete and the owner consumes the
  `work_item_completion` gate.

None of the first three states implies a later one.

## Work-item initialization and branch safety

Initialization and resume are separate state-machine entry paths. The caller
must select one explicitly; no resolver may infer initialization from a failed
resume or infer resume from a branch collision.

### Initialization preflight

`work_item_init / initialize-work-item` for a brand-new post-activation request
starts from a request envelope, not an existing authoritative workflow. It must
not require an existing canonical work branch, v3.1 workflow identity,
lifecycle generation, or anchor. It performs these checks in order:

1. normalize and verify the intended repository identity and `origin`;
2. require the current branch to be exactly `main`;
3. require tracked and untracked working-tree state to be clean;
4. fetch/prune `origin/main`, the exact intended work ref, and the reserved
   lifecycle-tag namespace for the requested work-item ID;
5. require local `main` to be neither ahead of nor divergent from
   `origin/main`, then synchronize it using fast-forward-only rules;
6. validate the requested work-item ID and deterministic branch name;
7. require `work/<work-item-id>` not to exist locally or remotely;
8. require no local or remote lifecycle registration, workflow identity, PR
   history, terminal tombstone, or other authoritative claim for that ID; and
9. stop without creating or moving refs on any ambiguity, collision, fetch
   failure, dirty tree, unexpected remote, or divergent/ahead `main`.

Only after that preflight succeeds may initialization:

1. create and check out `work/<work-item-id>` at the synchronized full
   `origin/main` SHA;
2. generate a fresh opaque lifecycle generation;
3. create the initial v3.1 workflow identity on that branch, binding repository,
   ID, deterministic branch, and generation, and commit it as the minimal
   bootstrap commit; only this unpublished bootstrap snapshot may have a null
   `lifecycle_anchor_sha` while it records `work_item_init`;
4. obtain the full bootstrap commit SHA and create the annotated lifecycle tag
   `refs/tags/orchestration/<work-item-id>/<generation>` pointing to it;
5. update the branch workflow to record that SHA as `lifecycle_anchor_sha` and
   enter `design / ready / none / create-or-revise-design`;
6. atomically push the canonical branch and lifecycle tag together so the
   remote cannot publish only half of the identity; and
7. re-fetch and perform the resume/execution preflight before reporting
   initialization success.

The bootstrap workflow's mutable `work_item_init` routing exists only in its
bootstrap commit; the lifecycle tag does not copy or control that routing. No
force push, reset, branch deletion, implicit stash, tag replacement, or reuse of
identity from `main` is part of ordinary initialization. A failed atomic publish
does not establish a remote lifecycle; local artifacts remain a collision and
require explicit recovery rather than an automatic retry that could mint a
second generation.

### Resume/execution preflight

Every already-initialized v3.1 action, including the first design action after
initialization, uses the lifecycle-registration and executable-ref resolution
algorithm above. It requires the remote canonical branch and authoritative
registration, matches the requested repository and workflow ID to the bootstrap
binding, verifies generation and anchor provenance plus ancestry, and rejects
terminal state. Failure is always fail-closed recovery; it never silently
enters initialization mode or executes a workflow copy from `main`.

## Checkpoint and PR policy

Commits represent meaningful repository checkpoints, not phases. Examples are:

- a reviewable design/documentation checkpoint;
- an implemented and locally validated slice;
- targeted reviewed fixes;
- a merge-ready evidence/state checkpoint;
- post-merge delivery evidence and final control-plane reconciliation.

Commit messages follow the observed conventional form (`docs:`, `feat:`,
`fix:`, `test:`, `ops:` plus an imperative summary). Empty commits are forbidden
unless an approved delivery acceptance design explicitly requires one.

After the first meaningful remote-worthy checkpoint, the orchestrator pushes
`work/<work-item-id>` and creates one Draft PR targeting `main`. The same PR is
updated throughout design, implementation, fixes, and review. Routine commits,
pushes, Draft PR creation/update, and read-only CI inspection need no human
gate. The PR must link the work item and authoritative design.

The existing GitHub `Validate` workflow is authoritative. PR failures block
merge readiness. A failure routes into design or implementation loops only
when evidence identifies a real defect; a flaky runner or transient service
does not manufacture a review finding.

## Final review routing and merge approval

For non-final approved slices, v3.1 retains
`human_gate / next_slice_approval`. For the final approved slice,
`implementation_review` and `fix_rereview` route to
`human_gate / merge_approval`, never directly to completion.

Before entering the gate, persist the exact implementation `reviewed_sha`,
then commit and push only the new immutable review and workflow transition.
Resolve the resulting current PR head dynamically and wait for its required
checks. The gate is valid only when:

- branch is exactly `work/<work-item-id>`;
- PR number and target `main` are verified read-only from GitHub;
- `git.reviewed_sha` equals the implementation SHA named by the approving
  immutable review and is an ancestor of the remote branch and current PR head;
- every commit after `reviewed_sha` changes only the same work item's workflow
  YAML and a new immutable implementation-review or fix-rereview artifact;
- the PR diff matches the approved work-item scope;
- required `Validate` checks for that exact head succeeded;
- unresolved review findings are empty;
- local working tree is clean;
- repository identity, canonical branch, lifecycle generation, and ancestry
  pass executable-ref resolution;
- read-only repository settings prove the selected merge path retains the head
  branch, and no cleanup action can delete it before completion;
- the final approved slice is recorded in `current_slice`.

The approval presentation must include branch, PR number, target, exact
dynamically resolved head SHA, reviewed SHA, check run and conclusions,
“unresolved findings: none”, clean-tree proof, control-plane lineage proof,
retention proof, and a high-level diff summary. Repository gate scope persists
only the stable values:

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

The current head SHA and validation-run identity are live evidence and must not
be written into repository state before merge. Any force update, changed
target, changed PR, failed/replaced required check, dirty tree, new finding, or
implementation/application change after `reviewed_sha` invalidates approval.
An allowed control-plane commit requires a newly presented exact head.

## Merge procedure

On explicit matching approval, the orchestrator:

1. fetches and re-resolves the current PR head and requires it to equal the
   exact full SHA presented to the human;
2. re-verifies stable gate scope, executable-ref identity, `reviewed_sha`
   ancestry, every intervening control-plane-only commit, successful required
   checks for that unchanged head, current branch protection, and read-only
   proof that merge will retain the work branch;
3. marks the PR ready for review if it remains Draft;
4. invokes the repository's enabled/approved merge strategy with GitHub's
   atomic expected-head facility (`expectedHeadOid` or equivalent) set to that
   unchanged presented SHA;
5. does not bypass protection, dismiss required review, force push, or push
   directly to `main`;
6. resolves and records the resulting exact full `main` SHA as
   `git.merged_sha`;
7. commits the transition to `delivery_verification` on the retained work
   branch and pushes it.

If the branch is absent after merge or the post-merge checkpoint cannot be
pushed to the same canonical ref, the orchestrator records no successful phase
transition and fails closed into explicit recovery/reconciliation. It never
substitutes the merge-time workflow snapshot on `main`.

If the presented head changed or cannot merge atomically, no merge occurs and
no merged SHA is invented. A clean stale-base
sync routes through bounded branch reconciliation and then requires fresh PR
validation and a new `merge_approval`. A semantic conflict routes to the
appropriate design or implementation path.

## Delivery-verification policy

`delivery_verification` is read-only observation unless an explicitly recorded
retry or existing typed production gate authorizes more. It verifies one exact
`git.merged_sha` across:

1. GitHub reports that SHA on protected `main` and as the primary PR result;
2. a `push`-event `Validate` run exists for that exact SHA;
3. Railway deployment metadata identifies the same SHA and enters `WAITING`;
4. the GitHub run succeeds and Railway continues rather than becoming
   `SKIPPED`;
5. pre-deploy logs show the exact-SHA verifier accepted that same SHA through
   `RAILWAY_GIT_COMMIT_SHA` before migration;
6. the database migration completes successfully;
7. the application starts and readiness succeeds;
8. production smoke succeeds;
9. no unexpected service, database, domain, volume, or IaC identity change is
   observed.

The immutable evidence records full SHA, PR URL/number, GitHub run URL/ID and
event, Railway deployment ID and metadata, verifier result, ordered UTC
timestamps, migration/startup/readiness observations, smoke result, and any
redactions. It must not contain secrets.

On success, commit the evidence plus workflow transition on the retained work
branch and enter `human_gate / work_item_completion`. The gate scope pins
`git.merged_sha` and `delivery.evidence_path`. Explicit approval then commits
and pushes the exact terminal state on that branch:

```yaml
phase: complete
status: complete
gate: none
blocking_findings: []
next:
  action: none
```

The final slice remains in `current_slice` and is present in
`completed_slices`. Completion is not durable until the terminal commit is
visible on the canonical remote branch. Only then may a later destructive
cleanup retain or delete the branch under the lifetime rules above.

## Failure routing

| Failure | Route |
| --- | --- |
| PR CI exposes approved-code defect | `fixes → fix_rereview`; fresh checkpoint/checks and merge approval |
| PR CI exposes design or risk defect | `design → design_review → design_approval` |
| Transient PR runner/service failure | retry/wait at current phase; no finding unless evidence shows a defect |
| Clean stale branch or mechanical merge conflict | `reconciliation` with exact refs and no semantic edit; fresh validation and merge approval |
| Semantic merge conflict | implementation fix or design review according to effect |
| Post-merge GitHub CI application failure | record delivery attempt; exceptional delivery remediation through `fixes` |
| Railway application/migration/startup failure | record delivery attempt; `fixes`, with schema safety assessment when migration began |
| Railway/GitHub outage or transient provider failure | remain in delivery verification; observe/retry when provider does so safely, or use bounded reconciliation |
| Manual production redeploy/restart needed | existing `production_mutation_approval` with exact SHA/target/stop conditions |
| Evidence/documentation mismatch | reconciliation with exact allowed paths and acceptance checks |
| Canonical work branch missing before completion | fail closed; explicit recovery/reconciliation using the exact recorded ref identity, never `main` |
| Retained branch or historical snapshot is terminal | non-executable history; no resume or migration |
| Duplicate/conflicting identity across refs | fail closed for explicit identity reconciliation; never auto-select a ref |

### Exceptional post-merge code remediation

Once the primary PR is merged it cannot carry new application fixes. A real
post-merge implementation defect therefore permits one narrowly scoped
remediation PR from the retained work branch (or a deterministic
`work/<work-item-id>/delivery-fix-<n>` ref when GitHub requires it), linked to
the primary PR and failure evidence. This is not a normal phase PR and is
allowed only after immutable delivery failure evidence identifies the defect.
It repeats targeted fix/re-review, merge approval, exact-SHA merge, and delivery
verification. The workflow's `git.pr_number`, `reviewed_sha`, and `merged_sha`
advance to the current remediation attempt; prior values remain only in
immutable delivery evidence. No force push or branch-protection bypass is
allowed.

Transient outages do not justify a code PR or empty commit. A provider rerun
that is safe and non-production-risk may be a bounded retry action. A Railway
redeploy, restart, rollback, migration retry, or other production-risk mutation
uses the existing production gate.

## Migration and compatibility

### Completed work items

Completed v1/v2/v3 workflow files, designs, reviews, and evidence remain
unchanged. Validators continue selecting their declared rules.

### Active work items

There is no bulk or automatic migration. Active pre-activation v3 items remain
v3 by default, including this installer. Migration is legal only through a
separately designed and explicitly requested migration procedure that defines
how independent lifecycle provenance can be established without inventing
history, preserves design/context/reviews/findings/slices/approvals, invalidates
unprovable gates, and fails closed on dirty or ambiguous identity. This design
does not authorize that procedure. Completed work items are never migrated.

### Future work items

All work items initialized after semantic activation use the distinct v3.1
initialization path, deterministic work branch, authoritative lifecycle tag and
bootstrap anchor, minimal `git` block, and merge/delivery gates.

## Implementation surface

The atomic implementation may update only the orchestration and validation
surface needed for this contract:

- `AGENTS.md` and repository workflow guidance;
- `.codex/skills/work-orchestrator/SKILL.md`;
- phase/review/fix/reconciliation skills whose final routes change;
- a small delivery-verification skill and agent profile only if role separation
  is necessary;
- `docs/workflow/README.md` and workflow/review templates;
- `scripts/validate-workflow-contract.mjs` and `package.json` only as needed for
  contract validation;
- this active workflow only as a v3 control-plane record; no v3.1 Git or
  delivery identity may be added to it.

It must not change application code, Railway configuration, GitHub protection,
credentials, database state, completed workflow files, or immutable historical
reviews. This installer uses only the existing v3/repository delivery procedure;
the new v3.1 lifecycle operations apply only to eligible post-activation items.

## Validation strategy

The implementation must add dependency-free table-driven validation for:

- every legal v3.1 phase/status/gate/action combination, including
  `work_item_init`, `merge_approval`, `delivery_verification`, and terminal
  completion;
- a design revised in response to active `design_defect` findings can enter
  `design_review / review-design` with the same typed findings and immutable
  source references, while no later phase may carry them;
- rejection of v3.1 state missing or contradicting canonical Git identifiers;
- fresh initialization with no canonical branch or registration is allowed;
- an existing local/remote canonical branch during fresh initialization is
  rejected;
- resume with no canonical remote branch fails closed and never enters
  initialization mode;
- branch-name derivation, dirty tree, non-`main` init, ahead/diverged main,
  remote collision, and atomic-registration fixtures;
- self-asserted workflow generation without an authoritative registration is
  rejected;
- workflow generation or anchor differing from the authoritative registration
  is rejected;
- a workflow copied to another branch/ref is non-executable;
- duplicate lifecycle registrations for one work-item ID fail closed;
- a missing lifecycle registration during resume fails closed;
- a bootstrap commit outside canonical-branch ancestry is rejected;
- one valid registration plus matching branch/bootstrap/workflow binding is
  accepted;
- a completed lifecycle registration remains immutable historical identity and
  is non-executable even after optional branch deletion;
- deletion attempted before completion is rejected, including auto-delete and
  cleanup paths;
- a missing canonical work branch fails closed without `main` fallback;
- a stale active-looking workflow file on `main` is ignored as executable
  state;
- a completed retained work branch is terminal and non-executable;
- duplicate/conflicting work-item identity across refs fails closed as
  ambiguous;
- a fresh work item synchronized from `main` receives only a new branch and new
  lifecycle generation, never inherited executable state;
- exact-head gate invalidation after a commit, target change, check failure, or
  dirty tree;
- final-slice routing to merge approval rather than completion;
- transition from approved merge through exact merged SHA to delivery
  verification, then completion gate only with evidence;
- delivery SHA mismatch at every correlation point;
- each failure-routing class, including transient retry versus design/fix
  promotion and gated production retry;
- retained work-branch resolution after the primary PR is merged;
- this installer workflow remains valid as v3 without Git/delivery identity;
- v3.1 validators do not require Git identity for any legitimate v3 workflow;
- new post-activation v3.1 work items do require branch, generation, anchor, and
  authoritative registration; and
- schema assertions that designs/reviews/evidence do not duplicate current
  phase, status, gate, findings, or next action.

Run `pnpm validate:workflow`, `pnpm lint`, `pnpm test`, `pnpm build`, and
`git diff --check`. No live GitHub/Railway mutation or destructive negative test
is required to validate this documentation/orchestration slice.

## Risks and mitigations

- **Tracked state after merge is self-referential.** Keep the canonical
  post-merge control plane on the retained work branch; never create recursive
  state-finalization PRs or direct `main` pushes.
- **A stale merge approval could authorize another revision.** Pin full head,
  PR, target, and validation run; any change invalidates approval.
- **Transient incidents could create process churn.** Require evidence of an
  actual design/implementation defect before entering review loops.
- **Post-merge defects need another PR.** Permit a remediation PR only as an
  exceptional failure route with immutable evidence and repeat all merge and
  delivery gates.
- **A non-terminal work branch can disappear.** Prove merge retention at the
  merge gate, reject cleanup deletion, and fail closed into exact-ref recovery;
  never fall back to `main`.
- **Stale workflow snapshots can look active.** Resolve only the explicitly
  registered canonical branch and validate repository, work-item, generation,
  lifecycle tag, bootstrap anchor, ref, and ancestry before routing.
- **Completed branches can be mistaken for resumable state.** Terminal identity
  is an immutable tombstone; retained branches are non-executable and optional
  deletion preserves PR/review/commit audit history.
- **Delivery evidence could leak secrets.** Record IDs, URLs, timestamps,
  conclusions, and redacted logs only.
- **V3.1 adoption could rewrite history.** Validate by declared version and
  keep pre-activation v3 items on v3 unless a separately designed migration is
  explicitly requested.
- **A YAML generation can impersonate identity.** Treat every workflow identity
  field as a claim and derive authority only from the remote lifecycle tag and
  its bootstrap commit.
- **A registration can be duplicated or moved.** Reserve the tag namespace,
  reject multiple same-ID registrations, verify the exact target on every
  resume, and never repair missing/moved tags through ordinary initialization.

## Atomic implementation slice

1. **`v3-1-git-delivery-contract`** — Implement the complete v3.1 orchestration
   contract atomically: schema/version handling, initialization and safe branch
   lifecycle, meaningful checkpoints and one primary Draft PR, final review
   routing to merge approval, protected merge execution, exact-SHA delivery
   verification, lightweight failure routing, retained branch control-plane
   tail, activation/compatibility guidance, templates, skills, and deterministic
   validation. Keep this installer work item on v3 through completion. Do not
   alter application behavior or live GitHub/Railway settings.

One slice is required because schema, routes, gate semantics, branch ownership,
post-merge state location, templates, and validation would be contradictory if
partially installed.

## Acceptance criteria

- New work items start from clean synchronized non-divergent `main` on exactly
  `work/<work-item-id>` with a fresh lifecycle identity registered by an
  immutable annotated Git tag to the bootstrap commit and fail closed otherwise.
- Initialization and resume are explicit, disjoint entry paths: fresh init does
  not require an existing branch/identity, while resume requires both and never
  falls back to init or `main`.
- Only the explicitly registered canonical work branch can supply executable
  v3.1 routing; stale `main` snapshots and inherited copies cannot.
- The work branch cannot be deleted before its terminal state is committed and
  pushed; unexpected loss fails closed into explicit recovery.
- After terminal completion, the workflow and any retained branch are
  non-executable history, while branch deletion is permitted but optional.
- Meaningful checkpoint policy replaces per-phase commit noise.
- One early Draft PR is the normal integration point through final merge.
- Final implementation approval routes to `merge_approval`, not completion.
- Merge approval persists branch, PR, target, and reviewed SHA, then dynamically
  presents the exact descendant PR head, successful checks, control-plane-only
  lineage, no findings, clean tree, retention proof, and diff summary. It
  re-resolves after approval and atomically merges only the unchanged head.
- Merge never bypasses protection and records the exact resulting `main` SHA.
- Delivery verification correlates that SHA through GitHub push CI, Railway
  metadata and `WAITING`, `RAILWAY_GIT_COMMIT_SHA`, verifier, migration,
  startup/readiness, and production smoke.
- Ordinary work items need positive delivery proof only.
- Delivery failures take the smallest semantically correct route.
- Completion is impossible before successful delivery evidence and explicit
  `work_item_completion` approval.
- Workflow YAML remains the sole mutable routing authority without duplicated
  Git status prose.
- Completed historical work items remain untouched; active migration is
  separately designed, explicit, and fail closed.
- This installer remains a legitimate v3 work item with no fabricated Git or
  delivery identity; v3.1 becomes eligible only after the installed contract is
  present on canonical `main`.
- The single approved implementation slice is
  `v3-1-git-delivery-contract`.
