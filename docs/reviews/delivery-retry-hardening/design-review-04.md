# Delivery Retry Hardening — Design Review 04

- Review date: 2026-09-30
- Work item: `delivery-retry-hardening` (`infrastructure`), Draft PR 19
- Scope: Review 03 findings, `37b49dd..ec4bd12` (design only)
- Reviewer: independent review agent (Claude Code), no file changes

## Findings from Review 03

- **MEDIUM-04 — PARTIALLY FIXED.** The guard is now the last read before the
  operation, a post-check follows it, and the remaining window is stated. The
  `retry-delivery-<NN>` post-check cannot be expressed as specified
  (MEDIUM-05), and a post-check failure has no defined state (LOW-07).
- **LOW-04 — FIXED.** Checked in a scratch copy of the config: with the
  `.d.mts`, `tsc` passes; without it, it fails with TS7016. Under vitest,
  `import.meta.main` is false; under Node 24.7.0 it is true.
- **LOW-05 — FIXED.** The guard takes the unfiltered list and picks the newest
  by `createdAt`. The provider data has `id`, `status`, `createdAt`, and
  `meta.commitHash`.
- **LOW-06 — FIXED.** Permanent stops exit through the owner's withdrawal to
  `verify-delivery`. `validateTransition` can express that exit for
  post-merge production gates alone.

## New findings

- **MEDIUM-05 — `design_defect`.** The mode is chosen by whether an ID is
  present. An ID-less post-check in `retry-delivery-<NN>` would therefore run
  as a pre-check and stop every successful retry with `already SUCCESS`.
  Correction: an explicit mode (`mode: "pre" | "post"`, CLI `--mode pre|post`).
  The ID is optional only in post mode and rejected in pre mode. Verify with
  ID-less post-check tests (clear for a newest SUCCESS or FAILED deployment of
  `sha`, stop on a newer deployment or an advanced `main`) and a test that the
  pre-check rejects an ID.
- **LOW-07 — `design_defect`.** A post-check failure, or a missing deployment
  ID after the operation, has no defined outcome. Leaving the item at the gate
  would allow a second redeploy under one approval. Correction: issuing the
  operation consumes the gate, and the item always leaves the gate. A failed
  or missing post-check blocks delivery verification with a `supply-` action
  for the owner. Withdrawal is legal only if no operation was issued. Pin the
  wording in the skills.
- **LOW-08 — `design_defect`.** No fixture keeps the withdrawal exit narrow.
  Correction: add illegal fixtures for `work_item_completion` →
  `verify-delivery` and for a pre-merge production gate → `verify-delivery`.

Size is 13,816 bytes, within target, and the change is still one slice.

## Verdict

**CHANGES REQUIRED**
