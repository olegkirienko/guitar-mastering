# Delivery Retry Hardening — Design Review 02

- Review date: 2026-09-30
- Work item: `delivery-retry-hardening` (`infrastructure`), Draft PR 19
- Design: `docs/technical-designs/delivery-retry-hardening.md` at `61797a1`
- Owning review: `design-review-01.md`
- Reviewer: independent review agent (Claude Code), no file changes

## Findings from Review 01

- **MEDIUM-01 — FIXED.** The post-merge production gate counts as after-merge
  and requires a full `reviewed_sha`. It is entered only from
  `delivery_verification` and keeps both SHAs unchanged. Required fixtures are
  listed. Implementing it cannot break existing fixtures: the only production
  gate fixture is v3, and no repository workflow sits at that gate.
- **MEDIUM-02 — FIXED.** The incident bounds are recorded (more than 131 s,
  less than about 13 min). The schedule is 15/30/60/120 s waits with reads at
  0/15/45/105/225 s, which reaches about 356 s after CI. The job ID is pinned,
  each re-read is logged, and healing is not guaranteed: the gate is the
  fallback.
- **MEDIUM-03 — FIXED at design level.** The approval is pinned to
  `merged_sha`, `NN` is defined, one operation runs while the gate is being
  used, and `retry-delivery-<NN>` is read-only. LOW-03 covers one leftover
  sentence.
- **LOW-01 — FIXED.** At most 12 requests ((1+5)×2) and about 305 s of
  worst-case extra time (4×20 s plus 225 s) are both correct.
- **LOW-02 — FIXED.** Every step failure carries the observed state and keeps
  the existing prefix.

## New finding

- **LOW-03 — `documentation_defect`.** `.codex/skills/delivery-verification/SKILL.md`
  lines 12–13 still allow a mutation when `next.action` records a "bounded safe
  retry". `retry-delivery-<NN>` would match, which contradicts the read-only
  retry state. The design must state that the sentence is replaced: delivery
  verification never performs the gated mutation and is read-only at
  `verify-delivery` and `retry-delivery-<NN>`, and the only mutation is the one
  pinned operation run while `production_mutation_approval` is being used. The
  implementation pins this wording with `requirePhrases`. Exact repair: allowed
  path is the design; acceptance is that the skills paragraph names this
  replacement. No decision changes.

Implementation notes (not findings):

- the from-phase test must match its own error message, because SHA
  continuity alone already rejects entry from `implementation`;
- the 12-call bound test needs a first-attempt 5xx on the runs read to reach
  12.

## Verdict

**APPROVED WITH RECONCILIATION** (LOW-03 only)
