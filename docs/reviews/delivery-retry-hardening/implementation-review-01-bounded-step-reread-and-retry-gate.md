# Delivery Retry Hardening — Implementation Review 01

- Review date: 2026-09-30
- Work item: `delivery-retry-hardening` (`infrastructure`), PR 19
- Slice: `bounded-step-reread-and-retry-gate` (final), commit `f2ed871`
- Reviewer: independent review agent (Claude Code), no file changes

Validation: `validate:workflow`, `test` (94 passed, 20 skipped, no real
delays), `build`, and `git diff --check main...HEAD` pass. PR CI run
`36735757956` passed. No CI, Railway, credential, or database change.

## Verdict

**CHANGES REQUIRED**

Correct and matching the design:

- the verifier re-reads only missing or `null` steps, at exactly 15/30/60/120 s
  and at most 5 reads, with a pinned job ID and independent reads;
- messages and logs match and contain no secrets;
- the built entrypoint still works;
- the guard's decision logic, its tests, and every validator rule except
  `reviewed_sha` continuity are shown to be meaningful by mutation tests.

## Findings

- **MEDIUM-01 — `implementation_defect`.** `scripts/delivery-retry-guard.mjs`
  parses arguments with `indexOf` and does not reject a flag with no value, an
  unknown or misspelled option, an extra positional, duplicates, or empty
  values. As a result, `--retry-deployment` with a missing or misspelled value
  becomes an unbound post-check that clears (fail-open), and bad usage never
  exits 2. Correction: strict `node:util` `parseArgs` inside try/catch, and
  reject empty, flag-like, and repeated values with exit 2. Verify with CLI
  tests that spawn the script with no `gh` or `railway` on `PATH` and assert
  exit 2 for each case.
- **LOW-01 — `implementation_defect`.** No fixture changes `reviewed_sha`
  across the gate: removing that continuity assert still passes. Correction:
  add `reviewed_sha` change fixtures for entry, approval, the blocked exit,
  and withdrawal. Verify that removing the assert fails validation.
- **LOW-02 — `documentation_defect`.** `.codex/skills/delivery-verification/SKILL.md`
  omits three things from the design: that withdrawal keeps both SHAs and
  records the guard's reason, that each retry's outcome is recorded, and that a
  further mutation needs a gate with the next `NN`. Correction: add these
  clauses and pin them.
