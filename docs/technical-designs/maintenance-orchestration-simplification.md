# Maintenance Orchestration Simplification

**Work item:** `maintenance-orchestration-simplification` (`maintenance`)

## Goal

Replace the repository-local v2 orchestration contract with the smallest
coherent v3 model that keeps meaningful safety boundaries while avoiding full
design/review loops for documentation-only reconciliation and workflow-state
repair.

The model must remain deterministic, fail closed when production or
infrastructure safety is uncertain, preserve immutable reviews and stable
finding IDs, and leave completed historical workflows untouched.

## Non-goals

- Do not change application, database, deployment, Railway, GitHub, or other
  provider behavior as part of this work item.
- Do not rewrite completed workflow files, historical designs, operator
  evidence, or review artifacts to conform to v3.
- Do not weaken review of architecture, behavior, data integrity, security, or
  infrastructure changes.
- Do not make documentation location determine risk. Classification depends on
  semantic effect, not file extension.
- Do not create a general-purpose workflow engine or add a runtime dependency.
- Do not allow an agent to repair ambiguous state silently while executing a
  different phase.

## Preserved invariants

1. Completed review artifacts are immutable snapshots. Corrections are recorded
   in a new artifact or in mutable workflow state; an old review is never
   rewritten.
2. Every actionable review finding has a stable identifier that is never reused
   for a different finding.
3. `docs/workflow/<work-item>.yaml` is the only mutable authority for the current
   `phase`, `status`, `gate`, active `blocking_findings`, and `next.action`.
4. Routing is validated before any phase execution or gate consumption.
5. Ambiguity about behavior, architecture, approved risk, target identity, or
   the authoritative outcome fails closed into review or human decision. It
   never qualifies for reconciliation.
6. Production/provider mutation, destructive infrastructure or database
   action, credential creation or rotation, architecture/design approval, the
   next implementation slice, and work-item completion require explicit human
   approval at the applicable boundary.
7. Gate approval is scoped, non-transitive, and non-reusable. Approval of a
   design, review, rehearsal, or earlier mutation cannot be consumed for a
   later gate.
8. A completed historical v1/v2 work item remains valid under its original
   contract and is not migrated merely for schema consistency.

## Retrospective: `railway-ci-cd-iac`

The completed work item is evidence for the v3 policy, not a migration target.
Its workflow and all historical review/evidence artifacts remain unchanged.

### Genuinely safety-critical loops and gates

| Evidence | Why the loop or gate was necessary | v3 treatment |
| --- | --- | --- |
| Design Reviews 01–03 (`HIGH-01` through `HIGH-03`, `MEDIUM-01`, `MEDIUM-02`) | They found missing exact-SHA CI enforcement, unsafe first-link discovery on production, an unreproducible negative test, unsafe verifier installation ordering, and an unresolved credential model. These changed architecture, production behavior, or approved risk. | Full `design → design_review → design_approval` remains mandatory. |
| Design Amendment 01 / Design Review 04 | Restart-policy parity affected effective provider behavior and IaC drift safety. | Design review and renewed approval remain mandatory. |
| Design Amendment 02 / Design Review 10 | The decision introduced a scoped production credential and its lifecycle. | Design review plus a separate `credential_change_approval` gate remain mandatory. |
| Production web-service identity correction | Correct target identity is a hard safety precondition for remote mutation. The corrected identity and invalidation of prior approval were safety-critical. | Identity ambiguity fails closed. A changed mutation target requires renewed design or mutation approval. |
| Implementation Review 14 `HIGH-04` | The checked-in IaC would have removed the live GitHub source and Wait for CI. | Implementation defect; require targeted fix and immutable re-review. |
| First-link, IaC apply, deployment, source, credential, and `DEPLOYMENT_VERSION` deletion approvals | These crossed provider, production, credential, or destructive boundaries. | Retain explicit, narrowly scoped remote-mutation gates. |
| Per-slice and final completion approvals | These bounded scope progression and final accountability. | Retain `next_slice_approval` and `work_item_completion`. |

### Process overhead

| Evidence | Why the full loop was excessive | v3 treatment |
| --- | --- | --- |
| Implementation Review 05 `MEDIUM-01` | The platform result was accepted; only stale design status text and an operator-record ending contradicted the already known outcome. | `documentation_defect → reconciliation`; no fix re-review when the review supplies an exact repair contract and destination. |
| Implementation Review 07 `MEDIUM-02` | CI and the live ruleset were accepted; only obsolete private-repository/status wording and workflow state needed alignment. | `documentation_defect` / `state_sync_defect → reconciliation`. |
| Design Reviews 11–13 `LOW-01` | Correcting the target identity and renewing approval were necessary, but two extra immutable reviews concerned only precise wording about already immutable evidence. | The identity decision gets full review; its exact evidence-wording correction uses reconciliation and then proceeds to a fresh approval gate. |
| Implementation Review 14 `MEDIUM-03` | Recording that the first-link proof was not obtained was important. Once the immutable review fixed the accepted facts and required wording, another full fix/re-review loop added little safety. | The reviewer may accept implementation behavior while routing the exact audit-text reconciliation through the light path. Any attempt to reinterpret the deviation or approved risk is promoted to design review. |
| Implementation Review 16 `MEDIUM-04` | The destructive action had already been separately reviewed, explicitly approved, executed, and verified; the defect was contradictory authorization wording in the mutable plan. | Reconcile the record against the pinned approved action, then route directly to completion approval. A new or broader destroy still requires a destructive-action gate. |
| Large workflow `notes` history | Repeated current-status prose duplicated phase, gate, findings, and next action and became stale. | v3 forbids routing/status prose in workflow notes and removes `notes` from the new template. |

The retrospective rule is: review the decision and the risk, not repeated prose
that merely records an already reviewed decision. A documentation defect can
still be safety-critical when it changes meaning; “documentation-only” describes
the repair surface, not automatically its route.

## v3 source-of-truth contract

### Mutable workflow state

For active v3 work items, one YAML file owns all current control-plane state:

```yaml
version: 3

work_item_id: example
work_item_type: maintenance
title: "Example"

phase: design_review
status: ready
gate: none

design:
  path: docs/technical-designs/example.md

context: []
completed_slices: []

current_slice:
  id: design
  name: "Work item design"

latest_review:
  path: null

blocking_findings: []

next:
  action: review-design
```

The v3 schema deliberately removes mutable duplicates:

- no `design.status`;
- no `current_slice.status`;
- no `latest_review.verdict`;
- no `next.phase`;
- no `next.human_approval_required`;
- no free-form `notes` containing current routing or status.

`phase` selects the legal transition family. `gate` names a pending human
boundary only when `phase: human_gate`. `next.action` is the single concrete
action allowed now. The orchestrator validates the allowed combination from the
state-machine table rather than comparing duplicated declarations.

The status vocabulary is intentionally small:

| Status | Meaning | Legal use |
| --- | --- | --- |
| `ready` | The recorded next action may execute now | Any active phase except `human_gate` |
| `blocked` | No mutation may proceed until named missing evidence or direction is supplied | Any active phase except `human_gate`; `next.action` must be `supply-<blocker>` and cannot itself mutate application/provider state |
| `awaiting_approval` | The pinned gate is the only action available | `human_gate` only |
| `complete` | Terminal work-item state | `complete` only |

`gate` must be `none` outside `human_gate`. A ready or blocked state must not
carry approval implicitly. A complete state has `gate: none`, empty
`blocking_findings`, and `next.action: none`.

`latest_review.path` is only a pointer to immutable evidence. Its verdict is not
copied into YAML. `design.path`, context paths, completed slice IDs, and the
current slice identify durable scope; they do not declare current routing.

Active findings use a compact typed record:

```yaml
blocking_findings:
  - id: MEDIUM-01
    class: documentation_defect
    source: docs/reviews/example/implementation-review-02-slice.md
    summary: "Mutable plan contradicts the accepted execution record."
```

IDs are unique within a v3 work item and remain attached to the same finding
for its lifetime. Only currently active blockers appear in YAML; closed findings
remain discoverable in their immutable review and must not be copied into a
second mutable ledger.

### Designs, reviews, and operator documents

- A design owns durable decisions, constraints, approved slice definitions,
  acceptance criteria, and risk policy. It must not say that a phase is current,
  a gate is pending, a finding remains active, or a particular next action is
  currently authorized.
- A review is an immutable dated assessment. It may record its verdict,
  findings, classification, repair contract, and recommended transition at that
  moment. It is historical evidence, never the current routing authority.
- An operator plan owns the bounded operation, targets, preconditions, stop
  conditions, rollback, and evidence requirements. Evidence records observed
  facts. Neither document owns workflow phase/status/gate/findings/next action.
- Historical statements remain historical when clearly dated. They must not be
  rewritten merely because current state advances.
- New design amendments are design artifacts. Their review is a separate
  immutable review artifact. Legacy amendment locations remain valid and are
  not moved.

## Revised state machine

### Phases

| Phase | Legal `next.action` family | Successful destination |
| --- | --- | --- |
| `design` | `create-or-revise-design` | `design_review` |
| `design_review` | `review-design` | `human_gate/design_approval`, `reconciliation`, or `design` |
| `implementation` | `implement-<slice>` | `implementation_review` or an in-slice `human_gate` for a pinned risky action |
| `implementation_review` | `review-<slice>` | next/completion gate, `fixes`, `reconciliation`, or `design` |
| `fixes` | `fix-<finding-ids>` | `fix_rereview` |
| `fix_rereview` | `rereview-<slice>` | next/completion gate or `fixes` |
| `reconciliation` | `reconcile-<finding-or-repair-id>` | the exact `next.on_success` destination recorded before repair |
| `human_gate` | `approve-<gate>` | the exact `next.on_approval` destination |
| `complete` | `none` | terminal |

`design_review` and `implementation_review` can route different findings from
one immutable review only when their destinations are compatible. Any active
behavioral finding takes precedence over reconciliation. For example, an
implementation review containing one implementation defect and one stale-text
defect routes both through targeted fixes/re-review; it does not partially
advance through reconciliation while executable behavior remains unapproved.

### Reconciliation transition data

While `phase: reconciliation`, the YAML contains only the data needed for a
deterministic bounded repair:

```yaml
reconciliation:
  id: RECON-01
  kind: documentation_defect # or state_sync_defect
  basis:
    path: docs/reviews/example/implementation-review-02-slice.md
    finding_ids: [MEDIUM-01]
  allowed_paths:
    - docs/operations/example-plan.md
    - docs/workflow/example.yaml
  acceptance:
    - "Replace the stale target with the reviewed target; do not change scope."

next:
  action: reconcile-MEDIUM-01
  on_success:
    phase: human_gate
    gate: next_slice_approval
    action: approve-next-slice
```

`next.on_success` is legal only in `reconciliation`; `next.on_approval` is legal
only in `human_gate`. These are prospective transition payloads, not duplicate
claims about current phase. The transition is atomic: update the permitted
documents, close only the named active findings, remove the reconciliation
block, and install the recorded destination fields together.

No new immutable review artifact is created for a successful reconciliation.
The owning review remains the immutable source of the finding and exact repair
contract; the YAML records the current closure by removing it from
`blocking_findings` and may retain a compact `last_reconciliation` containing
only ID, date, basis path, and validation result. That record must not contain
current routing prose.

Obvious nonsemantic typo, formatting, broken-link, or evidence-wording repairs
outside an active finding may be performed directly under an explicit
maintenance request without initializing a design/review workflow. If the edit
touches an active workflow's current meaning, use `reconciliation` with a
`RECON-*` ID and an unambiguous repository fact as its basis. Any uncertainty
about meaning or risk disqualifies the direct path.

### State-only repair of inconsistent state

Fail-closed preflight still stops ordinary phase execution with exactly
`WORKFLOW STATE INCONSISTENT`. A separately requested `repair-state` operation
is the sole exception and is a first-class orchestration action, not an implicit
side effect of another phase.

It is allowed only when all are true:

1. no application, provider, credential, database, or user-visible behavior
   changes;
2. an immutable review, explicit gate record, approved design, or unambiguous
   repository fact already determines the authoritative outcome;
3. the patch changes only workflow state and, when necessary, nonsemantic stale
   status/evidence wording in explicitly named mutable documents;
4. it does not change architecture, accepted risk, slice scope, target identity,
   review verdict, or historical evidence;
5. the requested repair states the expected canonical destination and passes
   schema, path, artifact, slice, finding, and transition validation.

The repair is applied atomically and records `last_reconciliation`. It needs no
human gate because it creates no new authority. If any condition is uncertain,
the repair stops and routes to design review or explicit human decision. This
exception never authorizes application code or remote mutation.

## Gate policy

Human gates exist only at meaningful authority boundaries:

| Gate | Required for | Minimum scope recorded in YAML before approval |
| --- | --- | --- |
| `design_approval` | New or materially revised architecture, behavior, or approved risk | Design/review paths and first approved slice |
| `next_slice_approval` | Entry into a later approved implementation slice | Current approved slice and exact next slice |
| `work_item_completion` | Terminal completion | Final approved slice and no active findings |
| `production_mutation_approval` | Production/provider mutation not covered by a more specific gate | Provider, environment, resource IDs, exact operation/plan, rollback/stop conditions |
| `destructive_action_approval` | Delete, irreversible migration, restore, or destructive database/infrastructure action | Exact targets, pinned plan, backup/recovery evidence, allowed destroy count |
| `credential_change_approval` | Credential creation, installation, rotation, or revocation | Owner, scope, storage destination, expiry/rotation, secret-safe verification |

One operation may require the most specific applicable gate; separate gates are
not stacked when a single gate record covers the same boundary completely.
Design approval never substitutes for an operational mutation gate. A gate
approval must match the currently recorded gate and pinned scope; changed target
IDs, plan contents, destroy counts, credential scope, or risk invalidate it.

A human-gate state uses one constrained prospective payload:

```yaml
phase: human_gate
status: awaiting_approval
gate: destructive_action_approval

gate_scope:
  provider: railway
  environment_id: <production-id>
  targets: [<exact-resource>]
  plan_digest: <digest>
  allowed_destroy_count: 1

next:
  action: approve-destructive-action
  on_approval:
    phase: implementation
    action: resume-<slice>
```

The destination status and `gate: none` are fixed by the destination phase and
installed atomically after approval. The scope payload is mandatory for remote,
destructive, and credential gates and is removed or archived as a compact audit
reference after consumption; it cannot authorize a second mutation.

Read-only inspection, local validation, evidence capture, documentation
reconciliation, and state-only repair require no human gate unless they are
inseparable from a risky mutation.

## Finding classification and fix routing

Every actionable review finding records both severity and one semantic class:

| Class | Definition | Default route |
| --- | --- | --- |
| `design_defect` | Architecture, behavior, requirements, security, data, operations, or accepted risk is wrong or incomplete | `design → design_review`; renewed `design_approval` when approved meaning changes |
| `implementation_defect` | Code, configuration, IaC, tests, or executable behavior fails the approved design | `fixes → fix_rereview` |
| `documentation_defect` | Mutable prose contradicts or incompletely records an already authoritative outcome, with no change to meaning or risk | `reconciliation` when an exact repair contract exists; otherwise promote to `design_defect` |
| `state_sync_defect` | Mutable YAML does not represent an already authoritative outcome | `reconciliation` or separately requested `repair-state`; otherwise fail closed |

Classification is semantic:

- A one-word target, command, permission, rollback, or safety-condition change
  can be a design or implementation defect even though only Markdown changes.
- A code comment, config comment, or YAML edit can qualify as documentation-only
  only if executable behavior is provably unchanged.
- Reconciliation cannot introduce a decision, reinterpret evidence, waive an
  acceptance criterion, broaden scope, or approve risk.

For each finding, the review artifact must include `Class`, impact, evidence,
required correction, and verification. For reconciliation-eligible findings it
must also provide exact allowed paths, forbidden changes, acceptance checks,
and the post-repair destination. If those details are absent or require judgment,
use the full fix/re-review or design-review route.

`APPROVED WITH MINOR FIXES` is replaced by the more precise routing outcome
`APPROVED WITH RECONCILIATION`. It means the reviewed architecture or
implementation is accepted, but named documentation/state defects must be
reconciled before the recorded gate or next phase. It is not available for
design or implementation defects.

## Deterministic validation and fail-closed rules

The v3 orchestrator validates before every action:

1. schema version and work-item identity;
2. required design and context paths;
3. the exact allowed `phase/status/gate/next.action` combination;
4. gate payload and destination compatibility;
5. current and completed slice membership in the authoritative design;
6. latest-review path and phase compatibility;
7. uniqueness, classification, source, and routing of active findings;
8. reconciliation eligibility, allowed paths, basis, acceptance checks, and
   destination;
9. final-slice proof before completion and later-slice proof before next-slice
   approval;
10. terminal-state exactness.

On inconsistency, ordinary execution reports `WORKFLOW STATE INCONSISTENT`, lists
conflicts and expected values, and performs no application/provider mutation.
It does not silently select one of two contradictory sources. Only the bounded
`repair-state` procedure above may restore the control plane.

## Migration strategy

### Completed historical work items

- Keep every completed v1/v2 workflow, design, review, amendment, operator plan,
  and evidence artifact byte-for-byte unchanged.
- The compatibility wrapper continues to understand legacy `lesson_id`, v1/v2
  duplicated fields, and `lesson_completion`.
- Validators select rules by the file's declared version. Completion remains
  valid under the version that governed it.

### Active work items when v3 lands

- Do not bulk migrate.
- At the next explicitly requested orchestration action, validate the active
  file under its current version first.
- If it is consistent, perform one bounded state-only migration before the next
  behavioral phase: set `version: 3`, remove duplicate mutable fields, classify
  active findings, and preserve design/review/context/slice references.
- If it is inconsistent but the authoritative outcome is already unambiguous,
  use the v3 `repair-state` eligibility checks and record the migration as the
  reconciliation. No design/review cycle or human gate is needed.
- If migration exposes ambiguous outcome, risk, target identity, slice, or gate,
  fail closed and request design review or human direction. Migration must not
  manufacture an approval.
- Do not rewrite immutable artifacts or historical narrative. Remove or correct
  mutable routing prose only in active, non-immutable documents and only when
  necessary to eliminate a live contradiction.

### Future work items

All newly initialized work items use the v3 template and source-of-truth rules.
This work item itself remains v2 until its approved implementation slice updates
the orchestration contract; converting its active YAML is part of that slice's
acceptance criteria.

## Implementation surface

The implementation is repository documentation/orchestration configuration
only. Expected files are:

- `AGENTS.md`;
- `.codex/skills/work-orchestrator/SKILL.md`;
- `.codex/skills/work-design/SKILL.md`;
- `.codex/skills/design-review/SKILL.md`;
- `.codex/skills/implementation-slice/SKILL.md`;
- `.codex/skills/implementation-review/SKILL.md`;
- `.codex/skills/targeted-fix/SKILL.md`;
- `.codex/skills/targeted-rereview/SKILL.md`;
- a new reconciliation skill and, only if needed for role separation, a matching
  repo-local agent profile;
- `docs/workflow/README.md` and v3 templates/review templates;
- `docs/workflow/maintenance-orchestration-simplification.yaml`, migrated to v3
  during implementation after approval.

The implementation must not touch completed workflow files or any existing
review artifact. It should update the generic launcher wording so examples are
not hard-coded to `railway-ci-cd-iac` and correct the existing “Odinary” typo as
incidental template maintenance within the approved slice.

## Validation strategy

Implementation validation must include:

- search assertions that v3 instructions and templates do not declare
  `design.status`, `current_slice.status`, `latest_review.verdict`, `next.phase`,
  `next.human_approval_required`, or routing `notes` as current authority;
- table-driven fixture checks, documented or scripted without a new dependency,
  for every legal phase/action/gate combination and representative illegal
  combinations;
- route tests for all four finding classes, including mixed findings and
  fail-closed promotion;
- reconciliation eligibility tests proving application/provider/credential or
  approved-risk changes are rejected;
- gate-scope tests proving a changed target/plan invalidates approval;
- legacy checks proving completed v1/v2 examples still validate and are not
  rewritten;
- active-migration checks for one consistent v2 state, one repairable stale
  state, and one ambiguous state that must fail closed;
- `pnpm lint`, `pnpm build`, and `git diff --check` as required by repository
  policy. No browser, PostgreSQL, or provider test is required unless the
  implementation unexpectedly touches those surfaces.

## Risks and mitigations

- **Misclassification could bypass review.** Default ambiguous documentation or
  state findings upward to `design_defect` or `implementation_defect`; require an
  exact repair contract for reconciliation.
- **Removing duplicate fields could hide intent.** Keep one explicit current
  phase, gate, and action, plus constrained destination payloads only for the two
  phases that require them.
- **A generic mutation gate could be too broad.** Use typed gates with pinned
  targets and plans; invalidate approval on any material change.
- **Legacy compatibility could become indefinite complexity.** Treat v1/v2 as
  read-compatible and transition-compatible only for active items; generate only
  v3 for new items and never migrate completed ones.
- **Reconciliation could become an unreviewed edit channel.** Restrict paths,
  named findings/repair IDs, acceptance checks, and forbidden effects. Any new
  judgment returns to review.

## Approved implementation slice proposed for review

1. **`v3-orchestration-contract`** — Update the repository-local orchestration
   rules, skills, templates, review classification, reconciliation path, gate
   policy, and compatibility guidance as one atomic contract change. Add the
   minimal validation fixtures/checks needed to demonstrate deterministic legal
   and illegal routing. Convert only this active work item's YAML to v3 as the
   migration acceptance example. Do not alter application code, provider state,
   completed workflows, or immutable historical artifacts.

One slice is intentional: the state schema, routing skills, finding taxonomy,
gate semantics, and templates form one contract and would be internally
inconsistent if introduced separately.

## Acceptance criteria

- `docs/workflow/*.yaml` is documented and enforced as the only mutable authority
  for phase, status, gate, active blocking findings, and next action.
- New designs, reviews, and operator templates cannot act as competing current
  routing sources.
- Documentation and state-sync defects have a deterministic reconciliation path
  that creates no redundant immutable review when eligibility is proven.
- Design and implementation defects retain review loops with stable finding IDs
  and immutable review artifacts.
- Risky remote mutations and meaningful progression boundaries retain explicit,
  scoped human gates.
- State-only repair is expressly permitted under the bounded conditions above
  and impossible to use for behavioral or risk changes.
- Completed historical workflows and artifacts remain untouched and valid.
- Active/future migration behavior is explicit, deterministic, and fail closed.
- The `railway-ci-cd-iac` retrospective is represented in guidance as the reason
  for the policy split without modifying that completed work item.
