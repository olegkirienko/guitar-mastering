# Implementation Review 05 — Railway IaC parity foundation

## Review metadata

- **Work item:** `railway-ci-cd-iac`
- **Type:** `infrastructure`
- **Slice:** `railway-iac-parity-foundation`
- **Authoritative design:** `docs/technical-designs/railway-ci-cd-iac.md`
- **Approved amendment:**
  `docs/reviews/railway-ci-cd-iac/design-amendment-01-restart-policy-parity.md`
- **Design review:**
  `docs/reviews/railway-ci-cd-iac/design-review-04-restart-policy-parity.md`
- **HEAD reviewed:** `1d95822ceafb5901199247df26e53112c7bee4d9`
- **Date:** 2026-09-21
- **Verdict:** `CHANGES REQUIRED`

## Preflight and scope

`PREFLIGHT PASSED`. The workflow state parses, identifies the approved design
and amendment, routes canonically to `implementation_review`, names the
implemented `railway-iac-parity-foundation` slice, has no gate or active
finding, and references artifacts that exist. The authoritative design defines
four later approved slices, beginning with `github-main-validation`; this is
not the final slice.

This review covers only the foundation slice: the typed IaC authoring source,
the controlled Config as Code handoff and reviewed apply, amended restart-policy
parity, removal of `railway.json`, supporting tests and documentation, and
current read-only production evidence. It does not authorize a GitHub source,
autodeploy, Wait for CI, branch-policy change, another IaC apply, deployment,
secret, or application change.

## Assessment

The implementation satisfies the slice's runtime and topology requirements.
`.railway/railway.ts` retains the approved named-partial boundary and preserves
the existing web variables by name. Its build, pre-deploy, start, readiness,
timeout, and retry settings match the approved design. The amended source omits
only the non-round-trippable `restartPolicyType`; its SHA-256 remains
`167bee7ca624bc7272e914cbb8412f54492c30b2f9241e791d4fee4c52003a9b`.
The legacy `railway.json` is absent, the Railway SDK is pinned at `3.11.0`, and
the foundation acceptance test and README now point at the active IaC source.

A fresh read-only `railway config plan --file .railway/railway.ts --json` on
2026-09-21 resolved the intended project and production environment, returned
`No changes`, no diagnostics, and no staged patch. Its desired graph owns only
the existing web service; the current graph still shows the existing domain,
PostgreSQL service, volume, and PITR bucket without proposing any change.

The active web deployment `e0e98aab-e244-4151-8622-3e88a6d4f9ed` remains
`SUCCESS`. Its manifest independently reports the approved commands,
`/api/v1/readiness`, the 120-second timeout, and effective `ON_FAILURE` with
three retries. The service still has no GitHub source. The production volume is
`READY`; PostgreSQL PITR is enabled and bucket-wired with a live backup and a
healthy archiver. Fresh production smoke returned health 200, readiness 200,
unknown API 404, and SPA root 200. No provider mutation occurred during review.

The hard-coded project/environment guard departs from the current general
Railway authoring preference for product-level names, but it is an explicit,
reviewed safety requirement of this work item and does not expand the named
partial's ownership. It is therefore not reopened in this implementation
review.

## Blocking finding

### MEDIUM-01 — The authoritative design still routes the already completed work back to design review

The current-status text in `docs/technical-designs/railway-ci-cd-iac.md` says
the restart-policy amendment is submitted, the foundation slice is paused,
`railway.json` is retained, and a new immutable design review is the next
action. Those statements now contradict the approved Design Review 04, the
recorded human approval, the implemented slice, the removed legacy file, the
clean live plan, and the canonical workflow state. The operator evidence also
ends with the incomplete sentence `The completed No application behavior
changed.`

This is not merely historical wording: the technical design is the work item's
authoritative specification, and its unqualified current-status and routing
statements can direct a later operator to repeat a completed gate or treat the
approved repository state as unauthorized. The malformed evidence ending also
weakens the durable handoff record.

Targeted fix: change only the design's current status, current foundation-slice
disposition, slice-list disposition, and closing next-action text so they
reflect that slice 1 is implemented and under review/fix handling while slice 2
requires the next-slice gate after approval. Preserve genuinely historical,
dated diagnosis and execution statements. Complete the final operator-record
sentence without changing its evidence claims. Do not edit IaC, application
code, dependencies, tests, Railway state, or future-slice behavior.

## Validation

- Railway CLI `5.57.7`; agent tooling revision `950aceb` is current.
- Authenticated Railway target/context read — passed.
- Fresh production IaC plan — `No changes`, no diagnostics.
- Active production deployment/configuration read-back — passed.
- PostgreSQL PITR status — enabled, wired, live, archiver healthy.
- Production HTTPS smoke — passed.
- Node `24.7.0` `pnpm lint` — passed.
- `pnpm test` — 12 files passed, 3 skipped; 55 tests passed, 19 skipped. The
  initial sandboxed run could not bind `127.0.0.1` (`EPERM`); the unrestricted
  retry passed without code changes.
- `pnpm test:browser` — 10 passed.
- `pnpm test:postgres` — 3 files and 19 tests passed.
- `pnpm build` — passed for the Vite client and Node server.
- `git diff --check` — passed before this review artifact/state transition.

## Verdict and transition

**Verdict: `CHANGES REQUIRED`**

Route to `fixes` with only `MEDIUM-01` active. The platform implementation is
otherwise accepted by this review, but the slice cannot enter
`next_slice_approval` until the authoritative design and durable operator record
are internally consistent. The targeted fix must make no application, IaC, or
remote Railway change; after it, run `fix_rereview` against `MEDIUM-01` only.
