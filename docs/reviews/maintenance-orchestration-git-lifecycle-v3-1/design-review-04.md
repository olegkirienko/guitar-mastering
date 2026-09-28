# Design Review 04 — Maintenance Orchestration Git Lifecycle v3.1

## Review metadata

- **Review date:** `2026-09-28`
- **Work item:** `maintenance-orchestration-git-lifecycle-v3-1` (`maintenance`)
- **Workflow state:**
  `docs/workflow/maintenance-orchestration-git-lifecycle-v3-1.yaml`
- **Authoritative design:**
  `docs/technical-designs/maintenance-orchestration-git-lifecycle-v3-1.md`
- **Source review:**
  `docs/reviews/maintenance-orchestration-git-lifecycle-v3-1/implementation-review-03-v3-1-git-delivery-contract.md`
- **Review scope:** targeted review of `HIGH-03`, `HIGH-04`, and `HIGH-05`
- **Verdict:** `APPROVED`

## Preflight and scope

`PREFLIGHT PASSED`. The workflow is a valid legacy v3 maintenance item with
`design_review / ready / none / review-design` routing. It identifies the
authoritative design, the single approved `v3-1-git-delivery-contract` slice,
the immutable source review, and exactly the requested active findings:
`HIGH-03` and `HIGH-04` as `design_defect`, and `HIGH-05` as
`implementation_defect`. Every declared context path exists. The repository's
workflow validator passed before review dispatch.

This review assesses only whether the revised authoritative design resolves the
root causes behind those three findings and specifies focused positive and
fail-closed validation. It does not re-review the current implementation or
unrelated v3.1 scope. It performs and authorizes no branch, commit, tag, push,
PR, merge, deployment, provider, credential, database, or application mutation.

## Finding resolution

### HIGH-03 — RESOLVED

The design now defines initialization and resume/execution as explicit,
disjoint entry paths. Fresh `work_item_init / initialize-work-item` begins from
a request envelope on synchronized `main`; it requires neither an existing
canonical work branch nor an existing lifecycle registration. Instead, it
requires both to be absent, rejects any same-ID identity or historical claim,
then creates the bootstrap commit, annotated lifecycle registration, anchored
workflow state, and atomically publishes the branch and tag.

Every already-initialized action uses the separate resume/execution preflight.
It requires the exact remote canonical work branch and exactly one authoritative
lifecycle registration. A missing branch or registration is recovery territory
and fails closed. Failed resume cannot enter initialization and cannot execute
from `main`, the working tree, another branch, another tag, or history. The
design therefore makes fresh initialization reachable without weakening the
post-initialization missing-ref failure.

The validation strategy covers the positive fresh-init case and rejects local
or remote branch collisions, registration collisions, missing branch or
registration on resume, stale active-looking `main` state, ambiguous claims,
and terminal identities without fallback.

### HIGH-04 — RESOLVED

The activation boundary now explicitly preserves this installer as a v3 work
item through terminal completion. It requires no retrospective canonical
branch, lifecycle generation, lifecycle anchor, PR, or delivery identity. Its
final approved slice follows the v3 `work_item_completion` route and the
repository's existing delivery procedure.

V3.1 becomes eligible only for brand-new work items initialized after the
installed contract is present on canonical `main` following this installer's
v3 completion. Active pre-activation v3 work items remain v3 by default; any
migration would require a separately designed and explicitly requested path
with independently provable provenance. Installation, validation, and resume
cannot auto-migrate them. Completed historical workflows and immutable evidence
remain untouched and continue to validate under their declared versions.

The validation strategy expressly proves that this installer remains valid as
v3 without Git/delivery identity, that legitimate v3 states never acquire a
v3.1 identity requirement, and that eligible post-activation v3.1 items do
require the new provenance and lifecycle contract.

### HIGH-05 — RESOLVED

The revised design no longer trusts lifecycle identity asserted only by the
current workflow. Initialization creates a minimal bootstrap commit containing
the repository, work-item ID, deterministic work branch, and fresh generation.
An annotated reserved-namespace orchestration tag points to that exact commit;
its name and annotation independently bind the same identity tuple. The remote
tag target is the authoritative lifecycle anchor. The current workflow's
repository, branch, generation, and `lifecycle_anchor_sha` values are claims
until resume verifies them against the tag, annotation, and bootstrap commit.

Resume requires exactly one registration for the requested work-item ID,
resolves its bootstrap commit without trusting the checkout, verifies all
identity bindings, proves that bootstrap commit is an ancestor of the canonical
work ref, and only then validates the current workflow and Git/PR ancestry.
Missing, moved, duplicated, mismatched, unanchored, or ancestry-inconsistent
registration fails closed. Conflicting same-ID or same-generation claims on
other refs are ambiguous and cannot be selected by recency or checkout. A
copied workflow on another branch is inert, and a completed registration plus
terminal history is a permanent non-executable tombstone even if the canonical
branch is retained or later deleted.

The validation strategy includes focused positive coverage for one matching
registration/branch/bootstrap/workflow binding and exact resume, plus negative
coverage for self-asserted or mismatched generation/anchor, duplicate or
missing registrations, copied workflows, conflicting identities across refs,
bootstrap commits outside canonical-branch ancestry, recreated or absent
canonical refs, stale `main` copies, and completed retained or deleted
lifecycle identities. These cases cover the provenance and duplicate-resume
root cause identified by the source implementation review.

`HIGH-05` is resolved in the authoritative design. This finding resolution is
not a claim that the current validator or resolver implementation already
conforms; the approved implementation slice must implement the revised
contract and undergo a new implementation review.

## Validation

- Node `24.7.0` `pnpm validate:workflow` — passed: 28 legal states, 8 illegal
  states, and 16 transitions verified after the review transition.
- `pnpm lint` — passed.
- The sandboxed `pnpm test` run could not bind `127.0.0.1` (`listen EPERM`), so
  its HTTP tests timed out; the same suite outside that network sandbox passed:
  73 tests passed and 19 were skipped.
- `pnpm build` — passed for TypeScript, the Vite client, and the Node server.
- `git diff --check` — passed.
- No Git/GitHub lifecycle or provider mutation was performed.

## Verdict and transition

**Verdict: `APPROVED`**

`HIGH-03`, `HIGH-04`, and `HIGH-05` are resolved in the revised authoritative
design, and no blocking design finding remains in this targeted scope. Enter
`human_gate / design_approval`. Explicit approval is required before the sole
approved `v3-1-git-delivery-contract` implementation slice may resume. The
installer remains governed by v3, and this review creates no v3.1 lifecycle
identity or Git/provider mutation.
