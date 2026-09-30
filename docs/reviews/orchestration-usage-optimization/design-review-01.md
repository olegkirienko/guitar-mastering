# Orchestration Usage Optimization — Design Review 01

## Review metadata

- Review date: 2026-09-30
- Work item: `orchestration-usage-optimization` (`maintenance`)
- Canonical branch: `work/orchestration-usage-optimization`
- Lifecycle generation: `611d90af-cf43-4e9d-8df0-734cf8973703`
- Bootstrap anchor: `d7634b2f7c2d9f8f8783ac7ee17ccde7a5b2b186`
- Draft PR: `18`, targeting `main`
- Authoritative design:
  `docs/technical-designs/orchestration-usage-optimization.md`
- Artifact identifier: `design-review-01`

## Preflight

`PREFLIGHT PASSED`. The fetched canonical branch, unique annotated lifecycle
registration, bootstrap target and ancestry, repository/work-item identity,
clean worktree, Draft PR head/target, and
`design_review / ready / none / review-design` route agree.

## Final verdict

**APPROVED**

## Findings

### Critical

None.

### High

None.

### Medium

None.

### Low

None.

## Scope and correctness

The design addresses the demonstrated usage sources without changing the root
model selection, application behavior, provider state, workflow legal states,
or approval scope. The personal `gpt-5.6-sol / medium` baseline and separate
corporate Astra profile are explicitly outside the repository mutation scope.
The reviewer-only effort change is narrow and preserves the existing model
family and mandatory review contract.

The human-gate rule is precise: ordinary approval publishes one transition and
stops, while immediate continuation requires a separate explicit user opt-in,
fresh state resolution, and full preflight. It preserves automatic continuation
for invocations that begin on ready non-human work, fingerprint protection, and
the prohibition on carrying approval across another gate.

## Provider-output discipline

The Railway policy is both economical and fail-closed. It requires exact IDs,
SHA/time filters, source-side field selection where available, bounded result
and log windows, local scalar projection before model output, and incremental
retrieval of only missing facts. It forbids secrets and wholesale provider
payloads while explicitly refusing to treat omitted evidence as success.

Keeping Railway mechanics in a conditional delivery-verification reference
reduces common context without hiding requirements from the phase that needs
them. No Railway query or provider mutation is required by implementation.

## Feasibility, validation, and slice boundary

The affected files have clear ownership and form one cohesive control-plane
change. Contract assertions can model the dispatch decision and check the
provider-output rules without adding a runtime dependency. Repository
validation plus the skill validators covers syntax, workflow compatibility,
and skill packaging. The single `bounded-orchestration-execution` slice is
appropriately final; splitting it would add gates and duplicated review context
without creating an independently useful intermediate state.

## Route

Enter the explicit `design_approval` human gate. Approval may authorize only
the final `bounded-orchestration-execution` slice defined by the design.
