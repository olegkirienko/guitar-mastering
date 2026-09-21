# Design Amendment 01 — Restart-policy IaC parity

**Work item:** `railway-ci-cd-iac` (`infrastructure`)  
**Current slice:** `railway-iac-parity-foundation`  
**Authoritative design:** `docs/technical-designs/railway-ci-cd-iac.md`  
**Date:** 2026-09-20  
**Status:** submitted for design review; no review verdict or approval recorded

## Evidence and reason

The reviewed production IaC apply completed and the active deployment reports
`restartPolicyType = ON_FAILURE` and `restartPolicyMaxRetries = 3`. Railway
documents `ON_FAILURE` as the effective default. Fresh independent raw
configuration reads omit `restartPolicyType`, while retaining the retry value.
Railway IaC is stateless. SDK 3.11.0 accepts the explicit field and includes
it in the desired graph, yet a fresh plan repeatedly proposes
`restartPolicyType: null → "ON_FAILURE"` after apply. The effective behavior
is correct, but the explicit default does not round-trip through the current
raw/IaC state model. The detailed read-only investigation and prior apply
record are in `docs/operations/railway-iac-parity-foundation-plan.md`.

## Narrow design change proposed

1. Record `restartPolicyType` as a Railway platform exception. Omit its
   explicit declaration from Railway IaC while continuing to manage
   `restartPolicyMaxRetries: 3`.
2. Define project parity as a clean IaC plan for all supported round-trippable
   fields plus runtime/read-only verification of documented platform
   exceptions.
3. After deployment, require effective service and active deployment reads
   to show `ON_FAILURE` and three retries. An absent, conflicting, or
   unverifiable effective value blocks acceptance.
4. If Railway later exposes the type as stable round-trippable state, permit
   explicit IaC management again through a separately reviewed change.

The previous explicit-type plan and apply remain historical evidence. This
amendment authorizes no IaC edit, apply, `railway.json` removal, application
change, or production mutation. Design Review 03 remains an immutable prior
approval of the earlier design and does not approve this amendment.

## Review and approval trail

Next action: a new immutable design review must assess this amendment and the
revised authoritative design. If approved, transition to an explicit
`design_approval` human gate before resuming
`railway-iac-parity-foundation`. The slice remains paused until that approval
is recorded. Review findings and verdict belong in the new design-review
artifact, not in this submitted amendment record.
