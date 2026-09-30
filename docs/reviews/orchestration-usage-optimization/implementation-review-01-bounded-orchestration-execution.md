# Orchestration Usage Optimization — Implementation Review 01

- Review date: 2026-09-30
- Work item: `orchestration-usage-optimization` (`maintenance`), PR 18
- Slice: `bounded-orchestration-execution` (final)
- Reviewed diff: `main...48b62274074d24e41663b9cc68fb108c3e48a4ef` (commits
  `a701c04`, `48b6227`)
- Design: `docs/technical-designs/orchestration-usage-optimization.md`,
  including owner-approved Amendment 01
- Reviewer: independent review agent (Claude Code), no file changes

Preflight passed. Validation on Node `24.7.0`: `validate:workflow` (30 legal
states, 11 workflows), `test` (82 passed, 20 skipped), `build`, and
`git diff --check` all pass. All nine changed skills pass `quick_validate`. The
diff has no `src/`, `server/`, CI, infrastructure, dependency, or credential
change.

## Verdict

**CHANGES REQUIRED**

## Findings

### MEDIUM-01 — `implementation_defect`

`scripts/railway-delivery-evidence.mjs` accepts `--no-logs`, which skips the
build-ordering, pre-deploy, migration, `server_started`, and readiness checks
and still prints `RESULT all delivery facts found` with exit 0. That
contradicts the script header, `references/railway-evidence.md` ("Every
expected fact that is absent … exit 1"), and Amendment 01. Reproduced for
`8926c80…` with `--no-logs`: exit 0.

Correction: remove `--no-logs`, or report every skipped check as `MISSING` and
exit nonzero. Verify: the `--no-logs` invocation cannot exit 0, the default run
for `8926c80…` exits 0, and the all-zero SHA exits 1.

### LOW-01 — `documentation_defect`

The lite-track summary in `README.md` lists "docs, tooling" and names no
excluded paths. The binding rule in `AGENTS.md` excludes `scripts/`, `.codex/`,
`.github/`, `.railway/`, `server/`, and the workflow, review, evidence, and
operations docs.

Correction: mirror the `AGENTS.md` positive list and defer to it for the
exclusions. Verify: the README summary agrees with `AGENTS.md`.

### LOW-02 — `documentation_defect`

The design's non-goal "Rewriting `AGENTS.md` broadly" is withdrawn by
Amendment 01 but carries no inline marker, unlike the other superseded
passages.

Correction: strike through and annotate it. Verify: the non-goal shows the
marker.

## Verified

- The moved contract is verbatim except the intentional sources-of-truth line.
- Gate approval stops. Explicit continuation keeps fresh preflight, the
  fingerprint check, and every gate stop. Approval stays scoped, single-use,
  and non-transitive.
- Fresh-session merge approval must name the full presented head SHA.
- Every phase skill loads `contract.md`. The lite-track exclusions and the
  `AGENTS.md` cap (3772 bytes) are asserted by the validator.
- The evidence script is read-only, redacts, and matches the pinned production
  IDs. It reproduces the recorded facts of the last delivery, and fails closed
  for an unknown SHA and for a missing CLI.
- `.rgignore` hides only history; explicit paths still search.
