# Fix Re-Review 06 — V3.1 Git delivery contract

## Review metadata

- **Review date:** `2026-09-28`
- **Work item:** `maintenance-orchestration-git-lifecycle-v3-1` (`maintenance`)
- **Slice:** `v3-1-git-delivery-contract`
- **Authoritative design:**
  `docs/technical-designs/maintenance-orchestration-git-lifecycle-v3-1.md`
- **Owning review:**
  `docs/reviews/maintenance-orchestration-git-lifecycle-v3-1/implementation-review-05-v3-1-git-delivery-contract.md`
- **Workflow state:**
  `docs/workflow/maintenance-orchestration-git-lifecycle-v3-1.yaml`
- **Base HEAD reviewed:** `4300ae2c7e1a4370a9b98e11cb4c6bc2dbe8e5ac`
- **Artifact identifier:** `fix-rereview-06-v3-1-git-delivery-contract`
- **Verdict:** `APPROVED`

## Preflight and scope

`PREFLIGHT PASSED`. The workflow is a consistent legacy v3 maintenance item
with `fix_rereview / ready / none / rereview-v3-1-git-delivery-contract`
routing. It references the approved revised design, the sole
`v3-1-git-delivery-contract` slice, Implementation Review 05, and exactly the
active findings `HIGH-06`, `HIGH-07`, and `MEDIUM-08`.

The installer correctly remains `version: 3` and contains no `git` or
`delivery` identity. Native v3.1 remote-ref resolution therefore does not apply
to dispatch of this installer review. This re-review verifies only the three
active findings and direct regressions caused by their fixes. No branch,
commit, tag, push, PR, merge, deployment, GitHub/Railway, database, credential,
or provider mutation was performed.

## Finding disposition

### HIGH-06 — FIXED

Executable identity resolution now examines every supplied registration that
claims either the requested work-item ID or the selected lifecycle generation.
It requires one exact annotated registration, matching repository, ID,
canonical branch, generation, bootstrap identity, tag namespace, and bootstrap
target. Duplicate same-ID registrations fail before selection; reused
generations and conflicting registration/bootstrap tuples also fail closed.

Other v3.1 refs claiming the selected ID or generation are rejected unless the
ref is the specifically derived inert `origin/main` snapshot whose embedded
repository, branch, generation, and anchor still point to the authoritative
work branch. Focused fixtures reject a second work ref, conflicting anchor,
conflicting repository, reused generation under another ID/ref, missing or
duplicate registrations, copied execution refs, and invalid canonical
ancestry. The single authoritative binding remains accepted.

PR metadata must match the workflow PR number, canonical head branch, `main`
base, and exact `git.head_sha`. The PR head must descend from the authoritative
bootstrap anchor and occur in canonical-branch ancestry. The PR merge strategy
must equal independently supplied repository strategy metadata. After merge,
the recorded `git.merged_sha` must match the PR result and lineage result for
the same PR and source head. Merge commits must contain the approved head as a
parent; squash/rebase results require provider attribution. Focused fixtures
accept valid pre-merge and merged bindings and reject missing bootstrap
ancestry, PR heads outside branch ancestry, strategy disagreement, and a merge
commit unrelated to the approved PR head.

The merge transition separately binds the observed protected-`main` result to
the approved PR number and exact gate head, installs that exact SHA into the
delivery state, preserves the approved head, and applies the configured
strategy lineage rule. Unrelated and non-attributable merge results are
rejected.

### HIGH-07 — FIXED

`verifyDelivery` now receives the workflow state and derives its sole expected
delivery identity from `workflow.git.merged_sha`. The evidence's recorded
authoritative SHA, protected-main SHA, primary-PR merge SHA, push-event GitHub
run SHA, Railway deployment SHA, `RAILWAY_GIT_COMMIT_SHA`, and exact-SHA
verifier SHA must all equal that value. The successful result returns the same
authoritative SHA together with the immutable evidence path.

Focused fixtures accept the exact shared SHA and reject each GitHub, Railway
metadata, Railway environment, and verifier mismatch. They also reject an
internally consistent successful evidence object for another SHA. The
delivery-to-completion transition re-verifies that evidence, preserves the
same workflow merged SHA, and requires both completion state and gate scope to
pin the verified evidence path and SHA. Missing, stale, or differently bound
evidence therefore cannot reach completion.

### MEDIUM-08 — FIXED

Initialization now validates a strict lowercase kebab-case work-item ID with a
bounded length and rejects reserved ref components. Generation input must be a
UUID. Deterministic branch and registration refs are checked against unsafe
Git-ref sequences and suffixes. Focused fixtures reject traversal, slash,
namespace, reflog, lock-suffix, case, repeated-separator, reserved-component,
and generation-injection inputs.

The initialization model proves that the bootstrap is a new full commit based
directly on synchronized `main`, constructs an annotated registration bound to
the complete repository/ID/branch/generation tuple, and requires one atomic
publication containing exactly the canonical branch and lifecycle tag. It
rejects unsupported or failed atomic publication, branch-only publication,
tag-only publication, invalid branch ancestry, lightweight or wrongly targeted
tags, mismatched annotation metadata, and workflow-anchor mismatch.

After successful publication, the fixture feeds the published branch state and
registration into the same `resolveExecutableRef` path used for normal resume.
That path verifies the tag target, bootstrap ancestry, workflow claims, and
canonical branch head. Branch-only and tag-only remote states remain
non-executable. Initialization and resume remain explicit disjoint entry modes;
a failed resume cannot select initialization or another ref.

## Preserved contract and regression review

- The installer remains a valid v3 workflow with no fabricated v3.1 Git or
  delivery identity.
- One canonical work branch, one lifecycle registration, and one primary Draft
  PR remain enforced by the existing focused fixtures.
- Stale `main` snapshots remain inert while copied work refs and terminal refs
  remain non-executable.
- Final v3.1 review routing still requires `merge_approval`; protected merge
  installs one exact merged-main SHA; delivery verification must succeed for
  that SHA before completion can be offered.
- Completion remains an explicit gate, and terminal branch deletion remains
  separately approved and unavailable before the terminal commit is pushed.
- Workflow YAML remains the only mutable authority for current routing.
- No direct regression from the three fixes was identified.

## Validation

- Node `24.7.0` `pnpm validate:workflow` — passed: 28 legal states, 8 illegal
  states, and 16 transitions verified.
- `pnpm lint` — passed.
- Unrestricted `pnpm test` — passed: 73 tests passed and 19 skipped.
- The previously observed sandboxed localhost failure is the known environment
  limitation: `listen EPERM: operation not permitted 127.0.0.1`; the same suite
  passes unrestricted without a code change.
- `pnpm build` — passed for TypeScript, the Vite client, and Node server.
- `git diff --check` — passed before this review artifact/state transition.
- No live Git/GitHub/Railway lifecycle or provider mutation was performed.

## Verdict and transition

**Verdict: `APPROVED`**

`HIGH-06`, `HIGH-07`, and `MEDIUM-08` are fixed, and no blocking finding
remains. The authoritative design defines no later implementation slice. This
installer remains v3, so transition to
`human_gate / work_item_completion / approve-work-item-completion`, with
`next.on_approval` pinned to the terminal state. Explicit owner approval is
required before recording the final slice in `completed_slices` and entering
`complete`; this re-review does not consume that approval prospectively.
