# Implementation Review 03 — V3.1 Git delivery contract

## Review metadata

- **Review date:** 2026-09-28
- **Work item:** `maintenance-orchestration-git-lifecycle-v3-1` (`maintenance`)
- **Slice:** `v3-1-git-delivery-contract`
- **Authoritative design:**
  `docs/technical-designs/maintenance-orchestration-git-lifecycle-v3-1.md`
- **Design review:**
  `docs/reviews/maintenance-orchestration-git-lifecycle-v3-1/design-review-02.md`
- **Workflow state:**
  `docs/workflow/maintenance-orchestration-git-lifecycle-v3-1.yaml`
- **Base HEAD reviewed:** `4300ae2c7e1a4370a9b98e11cb4c6bc2dbe8e5ac`
- **Artifact identifier:**
  `implementation-review-03-v3-1-git-delivery-contract`
- **Verdict:** `CHANGES REQUIRED`

## Preflight and scope

`PREFLIGHT PASSED`. The current workflow is a valid v3 maintenance workflow
with canonical `implementation_review / ready / none /
review-v3-1-git-delivery-contract` routing. It identifies the approved design,
the sole `v3-1-git-delivery-contract` slice, Design Review 02, and no existing
blocker. Every declared context path exists.

The current maintenance workflow correctly remains `version: 3` and contains
no fabricated `git` or `delivery` identity. Because it is not a Git-managed
v3.1 item, review dispatch used its local v3 workflow authority and did not
attempt canonical-ref resolution. No branch, commit, push, PR, merge, GitHub,
Railway, deployment, database, credential, or provider operation was
performed.

This review covers only the implemented `v3-1-git-delivery-contract` slice:
the repository rules, skills, workflow guidance and templates, validator, and
the unchanged v3 bootstrap state of this maintenance item. It does not review
or authorize application behavior or live provider configuration.

## Assessment

The implementation establishes most of the requested lifecycle shape.
V3.1 state has a minimal Git identity block; stale `main` snapshots are
described as inert; missing canonical refs and terminal retained refs are
rejected; final v3.1 review routes to `merge_approval`; delivery verification
correlates an exact merged `main` SHA; completion requires delivery evidence;
and deletion requires a pushed terminal commit plus destructive approval and
recovery evidence. The documented failure routes preserve design/fix review
for behavioral defects while keeping provider incidents and exact
documentation repairs on bounded retry or reconciliation paths.

The current v3 validator continues to accept the completed historical v3
workflow, and no completed workflow or immutable historical review has a
tracked modification. The Git and delivery blocks do not duplicate mutable
phase, status, gate, findings, or next-action fields.

Three safety gaps prevent approval. Two are contradictions in the approved
design and installed orchestration rules, so they return the work item to
design. The validation gap remains active with them and must be corrected
after the design establishes the authoritative identity boundary.

## Blocking findings

### HIGH-03 — Canonical-ref preflight makes fresh `work_item_init` unreachable

- **Class:** `design_defect`
- **Impact:** Every template creates a `version: 3.1` workflow in
  `work_item_init`, but the orchestrator requires every Git-managed v3.1 item
  to resolve `refs/remotes/origin/work/<work-item-id>` and fail when it is
  missing before dispatch. `initialize-work-item` is the action that is
  supposed to create that branch. A genuinely new item therefore fails closed
  before it can perform the safe initialization checks or create its canonical
  branch.
- **Evidence:** `.codex/skills/work-orchestrator/SKILL.md` lines 36–43 apply
  canonical remote-ref resolution before v3.1 dispatch, while line 50 routes
  `work_item_init` to initialization. The v3.1 templates already contain Git
  identity in `work_item_init`. The design's executable-ref algorithm requires
  the work ref to exist at lines 190–203, while its initialization contract at
  lines 254–274 requires the branch not to exist and creates it only near the
  end of the action.
- **Required correction:** Define one deterministic pre-initialization
  envelope that can safely start from synchronized `main` without treating a
  not-yet-created branch as a missing active canonical ref. Make the boundary
  at which the item becomes Git-managed explicit and atomic. Preserve the
  mandatory missing-ref failure for every initialized/resumed non-terminal
  v3.1 item, and do not allow a stale `main` workflow snapshot to become
  executable during initialization.
- **Verification:** Add fixtures proving a fresh same-ID-free request can
  execute exactly one safe initialization, while a missing canonical branch
  after initialization, a stale `main` copy, an existing ambiguous claim, and
  a terminal tombstone all fail closed without fallback.

### HIGH-04 — The approved bootstrap contradicts the required v3 identity rule

- **Class:** `design_defect`
- **Impact:** The current maintenance item was created and reviewed as v3 and
  has no historical canonical branch, lifecycle generation, PR, or pushed
  checkpoint. Retrofitting those values during implementation would fabricate
  v3.1 identity and contradict the explicit bootstrap requirement that this
  item remain v3. The implementation correctly leaves it on v3, but the
  authoritative design and approving review still require migration, so a
  later orchestrator could attempt the forbidden adoption or judge the correct
  state noncompliant.
- **Evidence:** the workflow declares `version: 3` and has no `git` or
  `delivery` block. The design at lines 69–88 requires this item to create a
  work branch, migrate to v3.1, push, and open a Draft PR; its implementation
  surface repeats that migration. Design Review 02 likewise says the slice
  must bootstrap and atomically adopt v3.1. The implemented global rules say
  active v3 items migrate only through an explicit compatible action, and the
  requested review criterion explicitly requires this maintenance item to
  remain v3.
- **Required correction:** Revise the authoritative design and its acceptance
  route so this contract-defining maintenance item remains v3 through review
  and completion, with no retrospective Git identity. Remove the item-specific
  migration requirement while preserving v3.1 initialization for future work
  and explicit, evidence-backed migration only for genuinely compatible active
  v3 items.
- **Verification:** Prove the current workflow validates as v3 without Git or
  delivery fields, reaches only the v3 final completion gate, and that new
  post-contract work items still start under the corrected v3.1 initialization
  contract.

### HIGH-05 — Identity validation trusts self-asserted generation and misses duplicate resume claims

- **Class:** `implementation_defect`
- **Impact:** A recreated canonical ref can present a different valid lifecycle
  generation and still pass the fixture resolver because the expected
  generation is read from that same workflow rather than from an independent
  immutable anchor. In addition, initialization checks `sameIdClaims` only
  when no branch exists, so an otherwise valid resume can coexist with another
  same-ID workflow/ref/PR-history claim and still pass. Those cases defeat the
  lifecycle-generation tombstone and duplicate-identity fail-closed rules.
- **Evidence:** `resolveExecutableRef` in
  `scripts/validate-workflow-contract.mjs` lines 807–826 receives only the
  requested ID, expected repository, and candidate refs; it never receives or
  proves an expected lifecycle generation independently of the selected YAML.
  Its conflict result also depends on candidates already being labeled
  `authority: independent-claim`. `initializeWorkItem` lines 743–751 skips
  `sameIdClaims` whenever a local or remote branch exists. The valid-resume
  fixture at lines 796–805 has no companion conflicting-claim case.
- **Required correction:** Bind lifecycle generation and ancestry to an
  immutable, independently derived Git/PR/history registration before trusting
  the selected workflow. Deterministically classify competing refs rather than
  accepting a caller-provided authority label. Check all same-ID and
  same-generation claims during both fresh initialization and idempotent
  resume, and reject any unresolved extra claim.
- **Verification:** Add negative fixtures for a recreated canonical ref with a
  different generation, an unanchored generation, a valid-looking resume plus
  another same-ID claim, the same generation on another ref, and conflicting
  repository/branch/ancestry metadata. Retain positive stale-`main` inherited
  snapshot and exact idempotent-resume fixtures.

## Accepted behavior to preserve

- A missing canonical branch for an already initialized v3.1 item fails closed
  without using `main`, the working tree, another branch, a tag, or history.
- Stale `main` and inherited workflow snapshots remain non-executable.
- Retained terminal branches are immutable tombstones; non-terminal deletion
  remains forbidden, and deletion eligibility begins only after pushed
  terminal completion plus scoped destructive approval.
- Final v3.1 approval requires `merge_approval`; exact merged-`main` SHA
  delivery verification and immutable evidence precede
  `work_item_completion`.
- Reconciliation and provider retries cannot change behavior, target identity,
  accepted risk, or bypass design, implementation, merge, delivery, completion,
  production, destructive, or credential gates.
- Workflow YAML remains the only mutable routing authority, and completed
  historical workflows remain governed by their declared version.

## Validation

- Node `24.7.0` `pnpm validate:workflow` — passed: 26 legal states, 6 illegal
  states, and 15 transitions verified.
- `pnpm lint` — passed.
- Initial sandboxed `pnpm test` — could not bind localhost (`listen EPERM`), so
  the HTTP tests timed out; this was an execution-environment restriction, not
  a product assertion failure.
- `pnpm test` outside the filesystem sandbox — passed: 73 tests, 19 skipped.
- `pnpm build` — passed for TypeScript, the Vite client, and the Node server.
- `git diff --check` — passed before this review artifact/state transition.
- All workflow-declared context paths exist.
- No live GitHub, Railway, branch, push, PR, merge, deployment, database,
  credential, or provider operation was performed.

## Verdict and transition

**Verdict: `CHANGES REQUIRED`**

`HIGH-03` and `HIGH-04` are design defects and take routing precedence. Return
to `design / create-or-revise-design` with all three findings active. Revise
the initialization and bootstrap contract first; preserve the accepted safety
properties above. After renewed design review and explicit design approval,
fix `HIGH-05` within the same approved slice and re-review the complete
identity boundary. No merge, delivery, completion, or provider gate is
reachable while these findings remain active.
