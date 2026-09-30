# Delivery Retry Hardening — Design Review 01

- Review date: 2026-09-30
- Work item: `delivery-retry-hardening` (`infrastructure`), Draft PR 19
- Design: `docs/technical-designs/delivery-retry-hardening.md` at `15f34e5`
- Reviewer: independent review agent (Claude Code), no file changes

Preflight passed: the canonical branch, lifecycle tag, and
`design_review / ready / review-design` route agree.

## Verdict

**CHANGES REQUIRED**

The verifier re-read cannot pass without positive evidence. Every read must
independently prove a completed, successful `validate` job with all six steps
passing, and explicit failures never wait. The incomplete-versus-failed split is
sound, and one slice is appropriate.

## Findings

- **MEDIUM-01 — `design_defect`.** The validator route as designed cannot
  accept its own legal fixture. `afterMerge` (`validateState`) omits
  `human_gate / production_mutation_approval`, so `reviewed_sha` must then be
  `null`. Post-merge states carry the reviewed SHA, and no rule keeps the Git
  SHAs stable across the gate. Correction: treat the post-merge production gate
  as after-merge, allow entry only from `delivery_verification`, and require
  `reviewed_sha` and `merged_sha` to stay unchanged through the
  delivery → gate → retry chain. Verify with an illegal `reviewed_sha: null`
  fixture and a `validateTransition` chain that fails when a SHA changes.
- **MEDIUM-02 — `design_defect`.** The 45-second window has no evidence
  behind it. In the incident, data was still incomplete 131 s after CI
  completed, and when it became consistent is unknown. There is also a risk
  that a manual rerun's jobs could supply the evidence through
  `filter=latest`. Correction: choose and justify a longer bounded backoff, pin
  the job ID across re-reads, and log each read so the next incident can be
  measured. Verify with tests on exact wait durations and a changed-job-ID
  failure.
- **MEDIUM-03 — `design_defect`.** The post-merge approval is not pinned to
  `git.merged_sha`, and it is not defined when the mutation runs. The resulting
  `retry-delivery-<id>` state looks like an ungated retry. Correction: require
  `gate_scope.merged_sha === git.merged_sha`, run the approved mutation exactly
  once while the gate is being used (after live stop-condition checks, as with
  merge approval), make `retry-delivery-<id>` a read-only re-verification,
  define `<id>`, and fix the skill wording. Verify with an illegal mismatched
  `merged_sha` fixture.
- **LOW-01 — `documentation_defect`.** The budget is misstated because each
  jobs read keeps its own network/5xx retry with a 10 s timeout. Correction:
  state the true request and wall-time bounds in the design and the operations
  doc, and test the upper bound on fetch calls.
- **LOW-02 — `design_defect`.** Immediate failures still hide what was
  observed. Correction: add the observed state (for example `duplicated` or
  `conclusion skipped`) to every step failure, keeping the existing prefix.
