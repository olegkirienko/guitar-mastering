# Design Review 02 — Maintenance Orchestration Git Lifecycle v3.1

## Review metadata

- **Review date:** 2026-09-28
- **Work item:** `maintenance-orchestration-git-lifecycle-v3-1` (`maintenance`)
- **Workflow state:** `docs/workflow/maintenance-orchestration-git-lifecycle-v3-1.yaml`
- **Authoritative design:** `docs/technical-designs/maintenance-orchestration-git-lifecycle-v3-1.md`
- **Prior review:** `docs/reviews/maintenance-orchestration-git-lifecycle-v3-1/design-review-01.md`
- **Current HEAD:** `4300ae2c7e1a4370a9b98e11cb4c6bc2dbe8e5ac`
- **Review scope:** targeted re-review of `HIGH-01` and `HIGH-02`, plus direct
  regressions in the revised lifecycle and executable-ref model
- **Verdict:** `APPROVED`

## Preflight and scope

`PREFLIGHT PASSED`. The current v3 workflow identifies the maintenance work
item and authoritative design, all declared context paths exist, and
`design_review / ready / none / review-design` is internally consistent. The
only active findings are the two `design_defect` findings from Design Review
01. The design still contains exactly one implementation slice,
`v3-1-git-delivery-contract`, and `current_slice: design` is valid for this
re-review.

This review assesses only the revisions required by `HIGH-01` and `HIGH-02`
and checks that they do not weaken the previously accepted delivery model. It
does not authorize or perform implementation, branch creation, commits,
pushes, PR operations, GitHub settings changes, Railway operations, or other
provider mutation. Design Review 01 remains an immutable snapshot.

## Finding resolution

### HIGH-01 — RESOLVED

The design now makes `work/<work-item-id>` the mandatory executable control
plane from successful v3.1 initialization through terminal completion. It
requires read-only retention proof before offering `merge_approval` and again
immediately before merge; missing proof, enabled automatic deletion, or a
cleanup policy capable of deleting the branch blocks merge. Manual,
automated, and orchestration cleanup must reject deletion while the canonical
workflow is non-terminal.

The completion boundary is now deterministic. `work_item_completion` is
consumed on the canonical work branch, and the exact terminal YAML must be
committed and visible on the remote branch before deletion becomes eligible.
A retained terminal branch is an immutable tombstone and is rejected before
checkout or action dispatch. Post-completion deletion is optional, separately
approved as destructive cleanup, and must record the terminal commit SHA,
lifecycle generation, PR history, and recovery evidence. If the canonical
branch disappears before completion, execution fails closed into exact-ref
recovery and never substitutes `main`.

The validation strategy now explicitly covers auto-delete, missing retention
proof, attempted pre-completion deletion, missing canonical refs, retained
terminal branches, and allowed post-completion cleanup. This closes the branch
lifetime, terminal durability, and deletion gap without adding a routine
second PR or a direct push to `main`.

### HIGH-02 — RESOLVED

The design now defines a ref-qualified resolver. A requested work-item ID maps
to the deterministic remote ref `refs/remotes/origin/work/<work-item-id>` in
the normalized repository. The resolver fetches and reads the workflow
directly from that ref, verifies repository identity, requested ID, workflow
path, deterministic branch, immutable lifecycle generation, Git/PR ancestry,
and pinned SHA metadata, and only then dispatches the single recorded action.
A missing canonical ref fails closed with no fallback to `main`, the current
checkout, another branch, a tag, or history.

Workflow files on `main`, later work branches, merge commits, tags, and Git
history are explicitly inert application-tree snapshots. An inherited copy
whose embedded branch points to the original canonical ref cannot route from
the inheriting ref. A second independent claim with conflicting repository,
work-item, branch, generation, or ancestry metadata is ambiguous and fails
closed rather than selecting the newest or current copy.

Fresh initialization is also isolated from stale snapshots. It starts only
from clean, fetched, synchronized, non-divergent `main`; rejects any unresolved
same-ID file, ref, or Git/PR-history claim; creates the deterministic work
branch at that exact full SHA; generates a new lifecycle UUID; and initializes
the v3.1 identity only on that branch. It never inherits executable state or a
lifecycle generation from `main`. The repository identity, work-item ID,
canonical branch, lifecycle generation, and verified ancestry therefore form a
sufficient selection boundary, with ambiguity rejected rather than guessed.

The validation plan includes stale active-looking `main` snapshots, future
branches forked from them, multiple retained completed branches, missing and
wrong refs, rewritten/divergent ancestry, duplicate identities, fresh
initialization, and exact `merged_sha` delivery correlation.

## Preserved invariants and direct-regression assessment

- **One-PR delivery:** one early Draft PR remains the ordinary integration
  point. A later remediation PR is restricted to an evidenced post-merge code
  defect and is not a control-plane finalization path.
- **No routine direct pushes to `main`:** merge uses the protected PR path;
  later control-plane checkpoints remain on the retained work branch.
- **Exact delivery truth:** `git.merged_sha` is the exact resulting full SHA on
  `main` and is correlated through GitHub, Railway, the pre-deploy verifier,
  migration, readiness, and smoke evidence.
- **Temporary work-branch authority:** the canonical work branch is the sole
  executable control plane while non-terminal, then becomes non-executable
  history at the pushed terminal commit.
- **Single mutable routing source:** only the workflow YAML on the resolved
  canonical ref owns phase, status, gate, active findings, and next action.
  Git identifiers and immutable evidence do not create a competing status
  ledger.

Goal, non-goals, implementation feasibility, risk handling, validation, and
the single atomic slice remain coherent. The expanded implementation surface
is limited to the orchestration contract, templates, skills, active-state
migration, and dependency-free validation needed to make the two corrections
enforceable. No unnecessary application abstraction or provider mutation was
introduced. No new blocking finding or direct regression was identified.

## Validation

- All workflow-declared context paths exist.
- Node `24.7.0` `pnpm validate:workflow` — passed: 16 legal states, 4 illegal
  states, and 7 transitions verified under the currently implemented v3
  validator, including after the review transition.
- `pnpm build` — passed: TypeScript project build, Vite client build, and
  server TypeScript build.
- `git diff --check` — passed.
- The initial attempt under the shell default Node `16.19.1` failed in Corepack
  before validator execution; rerunning with the repository-required Node
  version passed.
- No application, Git/GitHub lifecycle, or provider mutation was performed.

## Verdict and transition

**Verdict: `APPROVED`**

`HIGH-01` and `HIGH-02` are resolved, and no blocking finding remains. Enter
`human_gate / design_approval`. Explicit approval is required before the only
approved implementation slice, `v3-1-git-delivery-contract`, may begin. That
slice must first execute the design's bounded bootstrap of this contract-
defining item onto its canonical work branch and atomically adopt v3.1; this
review does not perform or prospectively approve those Git mutations.
