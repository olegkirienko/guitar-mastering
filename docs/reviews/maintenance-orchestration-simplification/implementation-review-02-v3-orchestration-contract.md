# Implementation Review 02 — V3 orchestration contract

## Review metadata

- **Review date:** 2026-09-27
- **Work item:** `maintenance-orchestration-simplification` (`maintenance`)
- **Slice:** `v3-orchestration-contract`
- **Authoritative design:** `docs/technical-designs/maintenance-orchestration-simplification.md`
- **Design review:** `docs/reviews/maintenance-orchestration-simplification/design-review-01.md`
- **Workflow state:** `docs/workflow/maintenance-orchestration-simplification.yaml`
- **Base HEAD reviewed:** `8c1912f8aa53dad635a0e62d1a8777da197655ea`
- **Artifact identifier:** `implementation-review-02-v3-orchestration-contract`
- **Verdict:** `CHANGES REQUIRED`

## Preflight and scope

`PREFLIGHT PASSED`. The v3 workflow state identifies the maintenance work item,
approved design, sole `v3-orchestration-contract` slice, latest immutable design
review, empty blockers, and canonical
`implementation_review / review-v3-orchestration-contract` routing. Every
declared context path exists. The authoritative design contains no later slice,
so an eventual approval must route to
`human_gate / work_item_completion`.

The review covers the repository orchestration rules, skills, templates,
finding taxonomy, reconciliation path, gate semantics, compatibility guidance,
root README synchronization, validation script, package command, and migration
of this active workflow. It does not review or authorize application, database,
deployment, GitHub, Railway, credential, or provider behavior.

## Assessment

The implementation establishes the intended v3 source-of-truth split.
`AGENTS.md`, the workflow guide, templates, and phase skills consistently make
workflow YAML the only mutable current-state authority while leaving designs,
reviews, and operator documents responsible for durable decisions and evidence.
The removed duplicate fields are absent from generated v3 state templates, and
the root README now provides a concise v3 overview linked to the detailed
contract instead of publishing the obsolete v2 terminal schema.

Finding classification, behavioral-finding precedence, immutable review rules,
and `APPROVED WITH RECONCILIATION` are represented in the review skills and
templates. The new reconciliation skill limits repairs to named findings,
immutable or unambiguous bases, allowed paths, exact acceptance checks, and a
pre-recorded destination. It expressly forbids behavioral, architecture, risk,
scope, identity, verdict, provider, credential, database, and immutable-artifact
changes.

The progression and operational gates retain scoped, single-use approval.
Templates generate v3, the compatibility wrapper retains legacy identity
support, and the orchestration guidance preserves completed v1/v2 workflows.
The completed `railway-ci-cd-iac` workflow, its design, and all historical
reviews have no tracked diff. No application or provider source changed.

The dependency-free validation script exercises phase/action/status
combinations, all gate types, typed finding routes, mixed-finding precedence,
reconciliation exclusions, changed gate scope, template field removal, legacy
completion, and representative migration outcomes. Its fixture coverage is
useful, but its final active-workflow assertion is tied to the temporary phase
being reviewed and therefore prevents the validator from surviving a valid
transition.

## Blocking finding

### MEDIUM-01 — Workflow validation is hard-coded to the transient implementation-review state

- **Class:** `implementation_defect`
- **Impact:** `scripts/validate-workflow-contract.mjs` requires the active
  workflow to contain `phase: implementation_review` and
  `action: review-v3-orchestration-contract`. The current validation passes only
  because those are the present values. This review's required transition to
  `fixes`, and any later transition to re-review, completion approval, or
  terminal completion, makes `pnpm validate:workflow` fail even when the state
  is legal. The repository would therefore ship a validator that rejects the
  workflow transitions it is intended to protect.
- **Evidence:** the phase-specific assertions are the final active-workflow
  checks in `scripts/validate-workflow-contract.mjs`; the v3 state machine and
  fixture table define several later legal phases for the same work item.
- **Required correction:** replace only the transient phase/action assertions
  with phase-agnostic validation of this active workflow's v3 identity and its
  current legal `phase/status/gate/next.action` combination. Preserve the
  existing generic legal/illegal fixtures, finding, reconciliation, gate,
  migration, template, and legacy checks. Add or retain a regression check that
  proves the validator accepts the active workflow after ordinary transitions,
  including `fixes`, `human_gate / work_item_completion`, and `complete`, while
  still rejecting incompatible combinations.
- **Verification:** `pnpm validate:workflow` must pass for the canonical fixes
  state produced by this review and the fixture coverage must prove the later
  completion-gate and terminal combinations without hard-coding one current
  phase. Run `pnpm lint`, `pnpm test`, `pnpm build`, and `git diff --check`.

## Validation

- Node `24.7.0` `pnpm validate:workflow` — passed for the pre-transition state:
  16 legal states and 4 illegal states verified. The phase-coupling defect above
  is established by direct inspection of the final assertions.
- `pnpm lint` — passed.
- `pnpm test` — passed outside the filesystem sandbox so localhost-bound HTTP
  tests could run: 73 passed, 19 skipped.
- `pnpm build` — passed for the Vite client and Node server.
- `git diff --check` — passed before this review artifact/state transition.
- All declared context paths exist.
- Completed Railway workflow/design/review paths have no tracked diff.
- Browser, PostgreSQL, and provider tests were not required by the approved
  documentation/orchestration-only validation plan.

## Verdict and transition

**Verdict: `CHANGES REQUIRED`**

Route to `fixes` with only `MEDIUM-01` active. The v3 contract content is
otherwise accepted and must remain unchanged. The targeted fix is limited to
the validator's transient active-state assertions and directly necessary
fixture coverage. After the fix, run `fix_rereview` against `MEDIUM-01` only.
This is the final approved slice, but it cannot enter
`work_item_completion` until the finding is fixed and re-reviewed.
