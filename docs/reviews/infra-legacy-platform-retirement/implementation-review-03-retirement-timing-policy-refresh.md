# Implementation Review 03 — Retirement timing policy refresh

## Review metadata

- **Work item:** `infra-legacy-platform-retirement`
- **Type:** `infrastructure`
- **Slice:** `repository-cleanup-and-retirement-preflight` (non-destructive
  policy/manifest refresh only)
- **Design:** `docs/technical-designs/infra-legacy-platform-retirement.md`
- **Design review:**
  `docs/reviews/infra-legacy-platform-retirement/design-review-02-retirement-timing-policy.md`
- **Date:** 2026-09-19
- **Verdict:** `APPROVED`

## Scope and authority

The owner explicitly clarified that exploratory GitHub Pages and Cloudflare
infrastructure requires no rollback window or timed drain. This review covers
only corresponding changes to the authoritative design and approval manifest,
plus the new immutable design-review artifact. No application code, CI,
Railway service, GitHub Pages setting, Worker, D1 database, or credential was
changed. Implementation Review 02 is preserved as an immutable snapshot of
the earlier policy and SHA; it cannot bind the revised manifest.

## Frozen approval identity

The revised non-destructive payload is identified by:

- base commit: `d0cd8f56e2a391bf0d2f546711129281999274d9` (reviewed cleanup
  present on remote `main`);
- tracked binary diff SHA-256, excluding the mutable workflow state:
  `3d0b0c22ab6b632dc9395dbc288ca74f48c59b9a375abc395cf5235380c63b25`;
- sorted untracked-file content-list SHA-256:
  `8d4aeb0f3c40d46408b765f328fffa0c19644a14096215d559b15a2c77ac0724`;
- revised approval manifest SHA-256:
  `5a59c71645e4be1b93caa70101df7a0c96452fda7146a5b87054602fb735c6ca`.

The untracked list contains only Design Review 02. The mutable workflow state
and this review file are excluded from the payload hashes so recording the
identity does not change it. Any further content or remote-identity drift
requires a new review and manifest binding before destructive approval.

## Assessment

The design and manifest now agree on exactly four pre-deletion checks: manifest
and repository-state verification; authenticated remote identities and zero
D1 application rows; Railway production health and independence; and explicit
human approval of the exact manifest and targets. No rollback window, timed
drain, or retained D1 export is required. The separate D1 export amendment,
Worker-before-D1 order, no-force dependency protection, dedicated-only
credential revocation, authenticated read-back, and recovery limitations remain
intact. The two approved implementation slices are unchanged; the final slice
still requires its own explicit gate and later completion review.

The read-only precondition check on 2026-09-19 found the cleanup on GitHub
default `main`, `.github/workflows/deploy.yml` absent remotely, Railway web and
PostgreSQL deployments `SUCCESS` with healthy canonical HTTPS endpoints and no
legacy variable dependency, the same Worker version/etag and D1 UUID, and zero
users, profiles, sessions, and lesson-progress rows in D1. These observations
are freshness evidence, not destructive authorization; the final slice repeats
them immediately before any mutation.

## Validation

- Node `24.7.0` `pnpm lint` — passed.
- `pnpm test` — 12 files passed, 3 PostgreSQL-gated files skipped; 55 tests
  passed, 19 skipped. An initial sandboxed run timed out in local HTTP tests;
  the unrestricted retry passed without code changes.
- `pnpm build` — passed for Vite client and Node server.
- `git diff --check` — passed.
- No application code or live remote resource changed.

## Findings

No actionable findings were identified.

## Verdict and transition

**`APPROVED`** for this non-destructive refresh only. A later approved slice,
`live-legacy-resource-retirement`, exists. Keep the workflow at the existing
`human_gate / next_slice_approval` with action
`authorize-destructive-live-legacy-resource-retirement`, now bound to the
revised SHA above. The owner's policy clarification is not approval to consume
that destructive gate.
