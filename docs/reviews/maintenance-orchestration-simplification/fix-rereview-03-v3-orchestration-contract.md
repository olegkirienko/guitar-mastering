# Fix Re-Review 03 — V3 orchestration contract

## Review metadata

- **Review date:** 2026-09-27
- **Work item:** `maintenance-orchestration-simplification` (`maintenance`)
- **Slice:** `v3-orchestration-contract`
- **Owning review:** `docs/reviews/maintenance-orchestration-simplification/implementation-review-02-v3-orchestration-contract.md`
- **Active finding reviewed:** `MEDIUM-01`
- **Authoritative design:** `docs/technical-designs/maintenance-orchestration-simplification.md`
- **Base HEAD:** `8c1912f8aa53dad635a0e62d1a8777da197655ea`
- **Artifact identifier:** `fix-rereview-03-v3-orchestration-contract`
- **Verdict:** `APPROVED`

## Preflight and scope

`PREFLIGHT PASSED`. The v3 workflow state routes canonically to
`fix_rereview`, has no gate, identifies the fixed
`v3-orchestration-contract` slice, retains exactly `MEDIUM-01` pending
verification, and references the owning immutable implementation review. The
authoritative design contains no later implementation slice, so this is the
final slice.

This re-review verifies only `MEDIUM-01` and direct regressions from its
validator fix. It does not reopen the otherwise accepted v3 contract or modify
application code, provider state, completed historical workflows, or immutable
review artifacts.

## Finding disposition

### MEDIUM-01 — FIXED

The workflow validator no longer asserts that the active maintenance workflow
must remain at `implementation_review` with
`review-v3-orchestration-contract`. It now parses the actual v3 workflow into a
state object and applies the same phase, status, gate, finding, reconciliation,
terminal, and transition rules used by its focused fixtures.

The parser covers current-state fields, typed blocking findings, prospective
`on_approval` and `on_success` destinations, reconciliation basis and allowed
paths, operational gate scope, completed slices, and forbidden duplicate v2
fields. Every legal fixture is rendered, parsed, and revalidated, preventing a
fixture-only pass that would reject an equivalent YAML state.

Focused transition checks now accept:

- `implementation_review → fixes`;
- `fixes → fix_rereview`;
- `fix_rereview → fixes`;
- `fix_rereview → human_gate / work_item_completion` for the final slice;
- `reconciliation →` its exact recorded prior legal phase;
- final approved `implementation_review → work_item_completion`; and
- `work_item_completion → complete` with the final current slice recorded in
  `completed_slices`.

They also reject a completion gate without final-slice proof and an illegal
direct `implementation → complete` transition. The actual workflow validated
successfully both at `fixes` during the targeted fix and at `fix_rereview`
during this re-review. No direct regression was found.

## Validation

- Node `24.7.0` direct validator fixtures — passed: 16 legal states, 4 illegal
  states, and 7 transitions verified.
- `pnpm validate:workflow` — passed against the canonical `fix_rereview` state.
- `pnpm lint` — passed.
- `pnpm test` — passed outside the filesystem sandbox so localhost-bound HTTP
  tests could run: 73 passed, 19 skipped.
- `pnpm build` — passed for the Vite client and Node server.
- `git diff --check` — passed before this review artifact/state transition.
- Completed Railway workflow, design, and immutable reviews retain no tracked
  diff.

## Verdict and transition

**Verdict: `APPROVED`**

`MEDIUM-01` is closed, and no blocking finding remains. The authoritative
design contains no later implementation slice, so transition to
`human_gate / work_item_completion`. Explicit approval of that newly current
gate is required before terminal completion. This re-review does not consume
completion approval prospectively.
