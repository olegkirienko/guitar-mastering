# Delivery Retry Hardening — Design Review 05

- Review date: 2026-09-30
- Work item: `delivery-retry-hardening` (`infrastructure`), Draft PR 19
- Scope: Review 04 findings, `bb5c240..4093a1c` (design only)
- Reviewer: independent review agent (Claude Code), no file changes

## Findings from Review 04

- **MEDIUM-05 — FIXED.** The mode is explicit everywhere (`--mode pre|post`,
  `retryGuardDecision({ mode, … })`). Pre mode rejects an ID, post mode takes
  it as optional, and tests and acceptance cover both.
- **LOW-07 — PARTIALLY FIXED.** Issuing the operation consumes the gate, the
  item always leaves the gate, a stopped or missing post-check blocks, and
  withdrawal is legal only before any operation. The design's
  `validateTransition` rules still list only two exits (LOW-09).
- **LOW-08 — FIXED.** Illegal withdrawal fixtures exist for
  `work_item_completion` and for pre-merge production gates.

## New finding

- **LOW-09 — `design_defect`.** The gate → `delivery_verification / blocked /
  supply-retry-<NN>-owner-decision` exit is missing from the
  `validateTransition` rules and from the fixtures. Implemented as specified,
  the defined post-check outcome could not be recorded, so the item would
  either take the forbidden withdrawal or stay at the gate. The listed blocked
  *state* fixture is already legal today. Correction: add a third exit, for
  post-merge production gates only, whose `NN` equals the `NN` in
  `on_approval`, under the same SHA continuity. Replace the state fixture with
  transition fixtures: legal; illegal with another `NN`, with a changed SHA,
  and from a pre-merge gate.

Pre/post semantics are unambiguous and fail-closed. Size is 14,718 bytes,
within target.

## Verdict

**CHANGES REQUIRED**
