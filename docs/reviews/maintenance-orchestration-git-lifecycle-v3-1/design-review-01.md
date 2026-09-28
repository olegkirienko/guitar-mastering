# Design Review 01 — Maintenance Orchestration Git Lifecycle v3.1

## Review metadata

- **Review date:** 2026-09-27
- **Work item:** `maintenance-orchestration-git-lifecycle-v3-1` (`maintenance`)
- **Workflow state:** `docs/workflow/maintenance-orchestration-git-lifecycle-v3-1.yaml`
- **Authoritative design:** `docs/technical-designs/maintenance-orchestration-git-lifecycle-v3-1.md`
- **Current HEAD:** `4300ae2c7e1a4370a9b98e11cb4c6bc2dbe8e5ac`
- **Review scope:** v3.1 Git/GitHub lifecycle, retained work-branch control plane,
  merge and delivery gates, exact-SHA correlation, branch lifetime, stale-state
  isolation, migration, compatibility, implementation boundary, and validation
- **Verdict:** `CHANGES REQUIRED`

## Preflight

`PREFLIGHT PASSED`. The v3 workflow state identifies the maintenance work item
and authoritative design, every declared context path exists, and canonical
`design_review / ready / none / review-design` routing is internally
consistent. There is no prior review, gate, or active finding.
`current_slice: design` is valid for design review, and the design contains the
single proposed `v3-1-git-delivery-contract` implementation slice. The current
repository workflow validator passes under Node 24.7.0. No implementation,
Git/GitHub mutation, provider mutation, or gate consumption occurred during
this review.

## Assessment

### Goal, scope, and lifecycle shape

The design has a clear goal and a disciplined implementation boundary. It
correctly separates implementation approval, protected merge, exact-SHA
delivery verification, and explicit work-item completion. The non-goals exclude
application, database, credential, Railway, branch-protection, and production
changes that are not intrinsically required by the orchestration contract.
The single atomic slice is justified because phase vocabulary, gate semantics,
Git identity, templates, skills, and validation cannot safely be installed as
independent partial contracts.

The normal one-Draft-PR model, protected `merge_approval`, and branch-resident
post-merge tail prevent routine recursive finalization PRs. The merge procedure
explicitly forbids direct pushes to `main`, branch-protection bypass, force
pushes, and invented merge SHAs. The exceptional remediation PR is bounded to
an evidenced post-merge implementation defect and repeats review, merge, and
delivery gates; it is not presented as a way to publish control-plane-only
completion commits.

### Exact-SHA delivery and split reference model

The design clearly distinguishes `git.head_sha` from `git.merged_sha` and
requires delivery verification to follow the exact resulting full `main` SHA
through GitHub push validation, Railway metadata, the pre-deploy verifier,
migration, startup/readiness, and production smoke. Routing after merge remains
on the declared work branch, while delivery observations refer to the merged
`main` SHA. This satisfies the requested separation in principle and avoids
pretending that later branch-only control-plane commits were deployed.

The post-merge model is nevertheless incomplete in two safety-critical places.
First, the design states that the work branch must survive and must not be
auto-deleted, but the merge gate and procedure do not prove or enforce the
condition. Second, a future work branch created from `main` necessarily
inherits every earlier work item's merge-time workflow snapshot. The design
does not define a deterministic ref-resolution rule that prevents those stale
copies from competing with the retained canonical branches.

### Feasibility, migration, and validation

The bootstrap is cautious about the currently untracked reviewed design/state,
unrelated user changes, synchronized `main`, recoverability, and branch
collision. Compatibility remains version-selected and avoids bulk rewriting
completed history. The implementation surface is feasible without application
or provider changes.

The table-driven validation plan is appropriately broad for phases, gates,
exact SHAs, failure routes, legacy compatibility, and active migration. It
mentions retained-branch resolution, but it cannot close the ambiguity until
the design specifies canonical-ref selection, stale-copy treatment, missing-ref
failure, and branch-retention/deletion rules precisely enough to produce
deterministic fixtures.

## Blocking findings

### HIGH-01 — Merge can delete the only canonical post-merge control plane

- **Class:** `design_defect`
- **Impact:** The primary PR may merge successfully while GitHub's
  auto-delete-head-branch behavior, a cleanup action, or a manual deletion
  removes `work/<work-item-id>` before the transition to
  `delivery_verification` is committed. The design places the only authoritative
  post-merge routing, delivery evidence pointer, completion gate, and terminal
  state on that branch, so deletion at this point makes the work item
  unrouteable and can permanently lose its final state. The current wording
  also leaves no complete answer for when the branch may be deleted after
  completion or where terminal authority lives afterward.
- **Evidence:** "Post-merge control-plane location" says v3.1 branches must not
  be auto-deleted, but `merge_approval` does not pin or verify a retention
  mechanism and the merge procedure does not stop when automatic deletion is
  enabled. "Risks and mitigations" defers deletion to a separately approved
  archival/destructive policy that is explicitly not defined. The non-goals
  exclude changing branch protection merely to adopt the contract, and the
  current repository evidence protects `main`, not the work-branch pattern.
- **Required correction:** Define the exact lifetime of
  `work/<work-item-id>` from initialization through post-merge verification and
  terminal completion. Before merge, require read-only proof that the selected
  merge path will retain the branch, or define a reviewed mechanism that
  guarantees restoration of the exact ref without creating a finalization PR
  or pushing to `main`; fail closed when that proof is absent. Prohibit manual,
  automated, and cleanup deletion before terminal completion. Then make one
  explicit durable choice: either v3.1 work branches are never deletable, or
  define a post-completion archival/deletion protocol, approval type,
  recoverability requirement, immutable final-state location, and canonical
  lookup rule after deletion. Reconcile the non-goal and implementation surface
  with any repository-setting or ref-protection prerequisite.
- **Verification:** Add deterministic fixtures for auto-delete enabled,
  retention proof missing, branch absent immediately after merge, deletion
  attempted before completion, terminal retention, and any approved archival
  path. Prove that no case creates a control-plane-only PR or direct `main`
  push and that terminal state remains resolvable after every allowed action.

### HIGH-02 — Ref resolution does not isolate canonical branch state from stale inherited snapshots

- **Class:** `design_defect`
- **Impact:** At merge time, `main` retains a pre-delivery snapshot such as
  `human_gate / merge_approval`, while the retained work branch later advances
  through delivery verification and completion. Every future work branch starts
  from `main` and therefore inherits that stale file, plus similar snapshots
  from earlier v3.1 items. Without an exact ref-qualified discovery and
  validation rule, an orchestrator or repository-wide validator can interpret
  the inherited copy as current, report contradictory active work, route the
  old item again, or silently ignore a missing/divergent canonical branch.
  This violates the single-authority and fail-closed goals and leaves future
  work items exposed to stale control-plane state.
- **Evidence:** "Post-merge control-plane location" says orchestrators must
  fetch and read the declared work branch, but it does not define which initial
  copy is trusted to obtain that declaration, how the current checkout affects
  authority, how all-workflow validation resolves each file, how a missing or
  rewritten branch is handled, or how inherited noncanonical copies are
  classified. `git.branch` is called canonical while the preserved v3
  invariant still describes an unqualified workflow path as the sole mutable
  authority.
- **Required correction:** Define a deterministic ref-qualified authority and
  discovery algorithm for pre-merge, post-merge, completed, migrated, and
  future work items. It must specify how a resolver obtains the expected
  `work/<work-item-id>` ref from an untrusted merge-time snapshot, verifies the
  remote/ref identity and ancestry or other integrity conditions, fetches the
  authoritative workflow, rejects branch/path/ID mismatches and missing or
  divergent refs, and treats stale copies on `main` and later work branches as
  noncanonical snapshots rather than executable state. Define how
  repository-wide validation and new-item initialization avoid inheriting
  actionable stale routing. Keep delivery verification pinned to
  `git.merged_sha` on `main` while all workflow transitions use only the
  resolved canonical ref.
- **Verification:** Add multi-work-item fixtures covering one and several
  completed retained branches, a new work branch forked from stale `main`, a
  stale merge-gate snapshot beside terminal canonical state, missing/wrong
  branch refs, branch/path/identity mismatch, divergent or rewritten refs, and
  exact merged-SHA delivery correlation. Prove a future work item cannot route,
  validate, migrate, or complete an earlier item from its inherited snapshot.

## Verdict and transition

**Verdict: `CHANGES REQUIRED`**

Return to `design` with `HIGH-01` and `HIGH-02` active. Revise the authoritative
design to provide enforceable branch retention/deletion semantics and a
deterministic ref-qualified authority/discovery model. The revised design must
retain the accepted protections against recursive finalization PRs and direct
`main` pushes, and must keep delivery evidence correlated to the merged
`main` SHA while workflow routing remains canonical on the work branch.

No implementation slice, bootstrap migration, branch/commit/push/PR action,
GitHub setting change, Railway operation, or other provider mutation is
authorized by this review.
