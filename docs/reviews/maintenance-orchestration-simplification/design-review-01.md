# Design Review 01 — Maintenance Orchestration Simplification

## Review metadata

- **Review date:** 2026-09-27
- **Work item:** `maintenance-orchestration-simplification` (`maintenance`)
- **Workflow state:** `docs/workflow/maintenance-orchestration-simplification.yaml`
- **Authoritative design:** `docs/technical-designs/maintenance-orchestration-simplification.md`
- **Current HEAD:** `8c1912f8aa53dad635a0e62d1a8777da197655ea`
- **Review scope:** v3 orchestration state model, gates, finding routing, reconciliation, state repair, legacy compatibility, migration, implementation boundary, and validation
- **Verdict:** `APPROVED`

## Preflight

`PREFLIGHT PASSED`. The workflow YAML parses and identifies the work item and
type, references the existing authoritative design and all declared context,
uses canonical `phase: design_review` with matching `next.phase`, has no active
gate or blocking finding, and records no prior review. `current_slice: design`
is compatible with the phase. The proposed `v3-orchestration-contract` slice
exists in the design, and no implementation, next-slice, or completion
transition is claimed.

## Assessment

### Goal, scope, and source of truth

The design directly addresses the maintenance goal. It makes the workflow YAML
the sole mutable authority for phase, status, gate, active findings, and next
action while keeping designs, reviews, and operator documents responsible for
durable decisions and evidence rather than current routing. Removing
`design.status`, `current_slice.status`, `latest_review.verdict`, `next.phase`,
`next.human_approval_required`, and routing notes from v3 eliminates the
identified duplicate mutable claims without discarding design, slice, review,
or context references needed for auditability.

The non-goals correctly exclude application and provider behavior, dependency
growth, historical rewrites, and silent repair. Classification is based on
semantic effect rather than file type, preventing a Markdown-only change to a
target, permission, rollback, or safety condition from bypassing review.

### State machine and deterministic routing

The proposed phases form a complete minimal model. Existing design,
implementation, review, targeted-fix, gate, and terminal paths remain, while
`reconciliation` is the only new phase. Prospective `on_success` and
`on_approval` payloads are confined to the phases that require them, so they do
not recreate competing current-phase fields. The constrained status vocabulary,
gate compatibility rules, active-finding schema, final-slice proof, and exact
terminal requirements are sufficient to validate routing deterministically.

The precedence rule for mixed findings is safe: any behavioral defect keeps the
entire result in the reviewed fix path. Reconciliation cannot partially advance
an implementation whose executable behavior is not approved.

### Reconciliation and state-only repair

The light path is bounded by an immutable or unambiguous basis, named paths,
exact acceptance checks, forbidden effects, named finding or repair IDs, and a
pre-recorded destination. It cannot introduce a decision, reinterpret evidence,
waive acceptance, broaden scope, or change approved risk. Missing information
or required judgment promotes the issue to design or implementation review.

The separately requested `repair-state` exception is appropriately narrower
than ordinary phase execution. It permits atomic control-plane restoration only
when the authoritative outcome is already known and forbids application,
provider, credential, database, user-visible, architecture, risk, scope, target,
verdict, or historical-evidence changes. Ordinary inconsistent execution still
stops with `WORKFLOW STATE INCONSISTENT`.

The direct path for obvious typo, formatting, link, and nonsemantic evidence
repairs is also bounded by explicit maintenance scope and semantic certainty.
Edits affecting active workflow meaning are elevated to recorded
reconciliation.

### Human gates and production safety

The gate policy preserves all meaningful authority boundaries: design approval,
next-slice entry, completion, production/provider mutation, destructive action,
and credential lifecycle changes. Operational gates require pinned provider,
environment, target, plan, count, recovery, ownership, or secret-lifecycle data
as applicable. Changed targets or plan contents invalidate approval, and design
approval cannot substitute for operational mutation approval.

Read-only inspection and local evidence gathering remain ungated, while any
remote mutation inseparable from those tasks still requires the applicable
typed gate. This preserves fail-closed infrastructure behavior without gating
documentation reconciliation.

### `railway-ci-cd-iac` retrospective

The retrospective draws the correct safety boundary. Design Reviews 01–04 and
10, target-identity correction, Implementation Review 14 `HIGH-04`, remote
mutation approvals, slice gates, and completion approval addressed architecture,
effective provider behavior, credentials, exact targets, or production risk and
remain full-review or human-gate concerns.

Implementation Reviews 05 and 07, the repeated `LOW-01` evidence-wording pass,
the exact audit-text portion of `MEDIUM-03`, and the already-approved-action
wording in `MEDIUM-04` are correctly identified as cases where a precise
reconciliation contract could have closed stale mutable prose without another
general review. The design does not reinterpret those immutable historical
artifacts or propose modifying the completed work item.

### Migration and compatibility

Version-selected validation and read compatibility preserve completed v1/v2
workflows under their original contracts. The no-bulk-migration rule and
next-action migration for active work avoid historical churn. Consistent active
state can migrate directly; repairable stale state uses the bounded repair path;
ambiguous approval, risk, target, slice, or outcome remains fail closed.

Keeping this work item on v2 until the approved implementation atomically
installs v3 is correct. It avoids placing the control workflow under rules that
do not yet exist.

### Feasibility, validation, and slice boundary

The work is feasible within repository-local instructions, skills, templates,
and validation fixtures without a new runtime dependency. The validation plan
covers legal and illegal state combinations, all finding classes, mixed-finding
precedence, reconciliation exclusions, gate invalidation, legacy compatibility,
active migration outcomes, repository validation, and diff hygiene.

The single `v3-orchestration-contract` slice is the smallest coherent boundary.
Schema, routing, review taxonomy, gate semantics, templates, and compatibility
would be contradictory if introduced as separately active contracts. The slice
explicitly excludes application code, provider state, completed workflows, and
immutable artifacts.

## Findings

No actionable findings.

## Verdict and transition

**Verdict: `APPROVED`**

Transition to `human_gate / design_approval`. Explicit approval is required
before the sole `v3-orchestration-contract` implementation slice may begin.
This review approves the design only; it does not authorize implementation,
state-schema migration, edits to orchestration rules or templates, application
changes, provider mutation, or any rewrite of completed historical artifacts.

