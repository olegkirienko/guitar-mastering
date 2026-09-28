# Implementation Review 05 — V3.1 Git delivery contract

## Review metadata

- **Review date:** `2026-09-28`
- **Work item:** `maintenance-orchestration-git-lifecycle-v3-1` (`maintenance`)
- **Slice:** `v3-1-git-delivery-contract`
- **Authoritative design:**
  `docs/technical-designs/maintenance-orchestration-git-lifecycle-v3-1.md`
- **Approved design review:**
  `docs/reviews/maintenance-orchestration-git-lifecycle-v3-1/design-review-04.md`
- **Prior implementation review:**
  `docs/reviews/maintenance-orchestration-git-lifecycle-v3-1/implementation-review-03-v3-1-git-delivery-contract.md`
- **Workflow state:**
  `docs/workflow/maintenance-orchestration-git-lifecycle-v3-1.yaml`
- **Base HEAD reviewed:** `4300ae2c7e1a4370a9b98e11cb4c6bc2dbe8e5ac`
- **Artifact identifier:**
  `implementation-review-05-v3-1-git-delivery-contract`
- **Verdict:** `CHANGES REQUIRED`

## Preflight and scope

`PREFLIGHT PASSED`. The workflow is a consistent legacy v3 maintenance item
with `implementation_review / ready / none /
review-v3-1-git-delivery-contract` routing. It references the approved revised
design, the sole `v3-1-git-delivery-contract` slice, Design Review 04, and no
active blocker. All declared context paths exist.

The installer correctly remains `version: 3` and has no fabricated `git` or
`delivery` identity. Because this item is not a native v3.1 work item, the
remote canonical-ref/lifecycle-registration resolver does not apply to its own
review dispatch. No branch, commit, tag, push, PR, merge, GitHub/Railway,
deployment, credential, database, or provider mutation was performed.

This review covers only the implemented `v3-1-git-delivery-contract` slice:
repository rules and guidance, skills, templates, the workflow contract
validator and its focused fixtures, and compatibility with legitimate v3
workflows. It does not review application behavior or authorize live provider
changes.

## Assessment

The revised implementation resolves the three prior root causes at the policy
level. Fresh initialization and resume are explicitly disjoint; fresh init does
not require an existing canonical branch or registration; resume requires both
and has no fallback to initialization or `main`. The annotated lifecycle tag
and bootstrap commit provide identity provenance independent of workflow YAML,
whose Git fields are treated as claims. The installer remains a valid v3 item.
The documented lifecycle also preserves one normal Draft PR, explicit
`merge_approval`, exact-SHA delivery verification, post-verification completion,
and deletion only after pushed terminal completion.

The state fixtures cover many positive and negative routes, and historical v3
states still validate without v3.1 identity. Three gaps remain in the focused
executable fixtures. They allow the validator suite to pass while required
identity ambiguity, exact-SHA binding, and atomic-initialization cases are not
actually rejected or proven.

## Blocking findings

### HIGH-06 — Executable-ref fixture accepts unresolved duplicate identity claims and does not prove PR/merge ancestry

- **Class:** `implementation_defect`
- **Impact:** An otherwise valid canonical branch and registration can coexist
  with another work ref claiming the same work-item ID or lifecycle generation,
  and `resolveExecutableRef` still succeeds. The resolver also checks only
  `head_sha`; it does not compare available PR ancestry or `merged_sha` metadata
  to the workflow claims. This leaves copied, reused, or conflicting identity
  scenarios outside the promised fail-closed boundary.
- **Evidence:** `resolveExecutableRef` in
  `scripts/validate-workflow-contract.mjs` lines 837–870 filters `refs` only for
  the exact canonical ref and filters registrations only by requested
  `workItemId`. Extra non-canonical refs are ignored, and a registration for a
  different ID that reuses the selected generation is ignored. The only
  metadata comparison after workflow validation is `selected.headSha` versus
  `git.head_sha`; no PR/head ancestry or `git.merged_sha` comparison exists.
  The copied-workflow negative fixture changes `executionRef`, but there is no
  fixture containing a valid selected ref plus a second conflicting same-ID or
  same-generation claim.
- **Required correction:** Deterministically inspect all fetched authoritative
  claims for both the requested ID and selected generation. Reject unresolved
  extra claims, reused generations, repository/branch/generation conflicts,
  and PR/ref ancestry disagreement. Where merge metadata is available, require
  it to agree with `git.merged_sha`. Preserve the accepted inert inherited
  `main` snapshot case by deriving why it is non-authoritative rather than by
  ignoring all extra refs.
- **Verification:** Add positive coverage for one matching
  registration/bootstrap/canonical-ref binding before and after the primary PR
  merge. Add fail-closed fixtures for a valid canonical ref plus another
  same-ID work ref, the same generation under another ID/ref, mismatched
  repository or branch metadata, mismatched PR head ancestry, and mismatched
  merged metadata.

### HIGH-07 — Delivery proof is not bound to the workflow's recorded merged `main` SHA

- **Class:** `implementation_defect`
- **Impact:** A workflow may record one `git.merged_sha` while an internally
  consistent delivery correlation object proves a different SHA. Both the
  state validation and `verifyDelivery` then pass independently, allowing the
  completion route to attest delivery of a revision other than the workflow's
  delivery truth.
- **Evidence:** `verifyDelivery` in
  `scripts/validate-workflow-contract.mjs` lines 1040–1056 chooses
  `correlation.mergedSha` as its own expected value and never receives the
  workflow or its `git.merged_sha`. The positive proof at lines 1058–1077 is
  likewise independent of `deliveryState`. `validateTransition` verifies the
  route and a caller-supplied `deliveryVerified` boolean but never binds the
  evidence SHA to the destination state's `git.merged_sha`.
- **Required correction:** Make delivery verification take the authoritative
  workflow `git.merged_sha` as its expected SHA and require every main/PR/CI/
  Railway/verifier observation and the immutable evidence identity to match it.
  Require the merge transition to install the exact observed protected-`main`
  result rather than accepting an unrelated well-formed SHA.
- **Verification:** Add a positive merge-to-delivery-to-completion fixture
  sharing one exact SHA across workflow state and evidence. Add negative cases
  where the proof is internally consistent but differs from workflow
  `git.merged_sha`, where the merge result differs from the transition state,
  and where evidence/gate scope differs from the recorded SHA.

### MEDIUM-08 — Fresh-initialization fixtures do not exercise atomic publication or identifier derivation

- **Class:** `implementation_defect`
- **Impact:** The required safe-init contract is represented only as preflight
  assertions plus a returned plan. The suite can pass without proving that the
  branch and annotated registration are published atomically, that a half-
  published result fails closed, or that invalid IDs cannot derive unsafe or
  non-deterministic branch/tag names.
- **Evidence:** `initializeWorkItem` in
  `scripts/validate-workflow-contract.mjs` lines 766–790 does not validate the
  work-item ID or derived ref names, validate `mainSha`, model creation of an
  annotated tag to the bootstrap commit, model atomic push success/failure, or
  re-resolve the published identity. The fixtures at lines 792–835 cover
  branch/registration collisions, dirty/non-main/ahead/diverged inputs, and
  inherited generation, but no atomic publication, partial publication,
  invalid-ID, target-binding, or post-publish resume case.
- **Required correction:** Extend the dependency-free model to validate the
  requested ID and deterministic branch/tag derivation, bootstrap target and
  annotation, atomic branch-plus-tag publication, partial/failed publication
  recovery behavior, and mandatory post-publish resume verification. Do not
  perform live Git mutations in these tests.
- **Verification:** Add one complete successful init fixture and fail-closed
  cases for invalid IDs/ref derivation, wrong bootstrap target, lightweight or
  mismatched annotation, branch-only publication, tag-only publication,
  failed atomic push, and post-publish resolution mismatch.

## Accepted behavior to preserve

- This installer remains a legitimate v3 workflow with no retrofitted v3.1
  branch, generation, anchor, PR, or delivery identity.
- Fresh initialization and resume remain explicit disjoint modes. Failed resume
  never falls back to initialization, `main`, the checkout, another ref, or
  history.
- The annotated lifecycle registration and bootstrap commit remain independent
  provenance; workflow identity fields remain claims only.
- Missing/duplicate/mismatched registrations, invalid ancestry, stale `main`
  state, copied state, and terminal retained branches remain non-executable.
- Native v3.1 work uses one normal work branch and one normal Draft PR, routes
  its final approved slice to `merge_approval`, verifies the exact merged SHA,
  and offers completion only after successful delivery evidence.
- Non-terminal branch deletion remains forbidden; terminal deletion remains a
  separately approved destructive cleanup after the terminal commit is pushed.
- Workflow YAML remains the only mutable routing authority, and legitimate
  existing v3 workflows continue to validate under v3.

## Validation

- Node `24.7.0` `pnpm validate:workflow` — passed: 28 legal states, 8 illegal
  states, and 16 transitions verified.
- `pnpm lint` — passed.
- Sandboxed `pnpm test` — localhost listeners failed with
  `listen EPERM: operation not permitted 127.0.0.1`; this was treated only as
  an environment limitation.
- The same `pnpm test` suite rerun unrestricted — passed: 73 tests passed and
  19 skipped.
- `pnpm build` — passed for TypeScript, Vite client, and Node server.
- `git diff --check` — passed.
- No live Git/GitHub lifecycle or provider mutation was performed.

## Verdict and transition

**Verdict: `CHANGES REQUIRED`**

Route directly to `fixes` for `HIGH-06`, `HIGH-07`, and `MEDIUM-08`. These are
implementation and focused-validation defects within the already approved
slice; no design revision is required. The targeted fix must preserve the
accepted behavior above and may not expand into live Git/GitHub/Railway
operations. After fixes, transition to `fix_rereview` for the same slice.
