# Delivery Retry Hardening — Design Review 03

- Review date: 2026-09-30
- Work item: `delivery-retry-hardening` (`infrastructure`), Draft PR 19
- Scope: the owner-requested retry guard, `e3384bb..c0d2ced`
- Reviewer: independent review agent (Claude Code), no file changes

Live facts, projected: `main` and the newest production deployment
(`456faeea…`, `SUCCESS`) are both at `732e2bb…`. The guard would correctly stop
with `latest deployment already SUCCESS`.

## Verdict

**CHANGES REQUIRED**

The decision rule is fail-closed, the vitest glob covers the test, and the
`stop_conditions` binding is sound. It must be checked in the post-merge branch
of `validateState`, and "names the guard" must be defined for both string and
list forms.

## Findings

- **MEDIUM-04 — `design_defect`.** The guard is one read before the
  operation, and the stop-condition re-checks come after it. If a newer
  deployment appears between the guard and the redeploy, the redeploy replaces
  newer code, and `retry-delivery-<NN>` would not notice. Correction: run the
  guard as the last read before the operation. Add a post-check (the newest
  deployment is the retry's own, and `main` is still `merged_sha`) both right
  after the operation and in `retry-delivery-<NN>`. A post-check failure stops
  and reports a possible rollback. State the remaining window. Verify with
  post-check tests and acceptance wording.
- **LOW-04 — `design_defect`.** A `.ts` test importing a `.mjs` fails
  `tsc -b` (TS7016), and a top-level CLI body calls `process.exit` under vitest.
  Correction: add `scripts/delivery-retry-guard.d.mts`, run the CLI only under
  `import.meta.main`, and list the `package.json` script. Verify that `lint`
  and `test` pass.
- **LOW-05 — `design_defect`.** The pure function receives an already chosen
  `latest`, so choosing the newest deployment goes untested. A commit filter
  copied from the evidence script would hide newer deployments. Correction:
  pass the unfiltered list, take the newest by `createdAt`, and stop on an empty
  list or a missing timestamp. Verify with tests for a FAILED deployment next
  to a newer one for another SHA, and for an empty list.
- **LOW-06 — `design_defect`.** Permanent stops (`main advanced`, a newer
  deployment, already `SUCCESS`) leave the item at the gate with no legal
  exit. Correction: separate temporary from permanent stops. For a permanent
  stop, the owner withdraws the gate, and the state returns to
  `delivery_verification / verify-delivery` with unchanged SHAs. The validator
  allows that one exit. Verify with a withdrawal transition fixture that fails
  when a SHA changes.
