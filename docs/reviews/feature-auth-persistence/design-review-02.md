# Design Review 02 — Authentication and persistence foundation

## Review metadata

- **Work item:** `feature-auth-persistence`
- **Work-item type:** `technical_feature`
- **Design artifact:** `docs/technical-designs/feature-auth-persistence.md`
- **Prior review:** `docs/reviews/feature-auth-persistence/design-review-01.md`
- **Workflow phase reviewed:** `design_review`
- **Date:** 2026-09-11
- **Verdict:** `APPROVED`

## Scope of re-review

This review verifies the revised design against `HIGH-01`, `HIGH-02`,
`MEDIUM-01`, and `MEDIUM-02`, checks the prior non-blocking recommendation, and
checks the surrounding architecture for direct regressions. Design Review 01
remains an immutable snapshot.

## Finding resolution

### HIGH-01 — RESOLVED

The Worker now owns a versioned catalog of supported lesson IDs, rejects an
unknown ID with `404 UNKNOWN_LESSON` before database access, and limits the
collection response to catalog membership. Slice 4 explicitly owns the catalog,
unknown-ID rejection, bounded envelope validation, and integration coverage.
This bounds both row cardinality per account and collection reads.

### HIGH-02 — RESOLVED

The design now defines a fail-closed build-time deployment target. Slices 1–5
keep GitHub Pages canonical with its existing subpath base and omit account and
sync entry points; the same revisions expose those capabilities only in Worker
preview builds. Slice 6 atomically verifies the Worker candidate, records the
last known-good Pages commit and artifact, disables routine Pages deploy
triggers, enables the Worker production build, and updates the canonical origin.
Acceptance tests cover both build variants.

### MEDIUM-01 — RESOLVED

The contract intentionally exposes username availability only during
registration through `409 USERNAME_UNAVAILABLE`. Login failures and rate-limit
responses remain neutral, and the integration strategy verifies that an unknown
username and a wrong password are indistinguishable. The disclosure is now a
documented MVP tradeoff instead of a contradictory requirement.

### MEDIUM-02 — RESOLVED

Sessions now have a defined 30-day absolute lifetime in both D1 and the
persistent cookie, with cookie expiry calculated from the same server instant
and never later than the row expiry. Login with a valid incoming session
atomically revokes it while creating the replacement and enforcing the target
account's session cap. Logout and deletion use matching expiration attributes,
and tests cover browser restart, expiry, and authenticated re-login.

### LOW-01 — NON-BLOCKING

The design now makes the deployed PBKDF2 benchmark a launch condition and
blocks production rather than silently weakening the policy when the selected
plan cannot meet it. It does not name a Workers plan or an exact Wrangler
version. This does not require another design cycle because slice 1 owns the
toolchain and configuration, and its implementation must select a currently
compatible Wrangler release before auth work begins. At review time,
Cloudflare requires Wrangler 4.20 or later for array-valued
`assets.run_worker_first` and 4.36 or later for the Rate Limiting API; the latter
is the effective minimum:

- <https://developers.cloudflare.com/workers/static-assets/routing/single-page-application/>
- <https://developers.cloudflare.com/workers/runtime-apis/bindings/rate-limit/>

The production plan choice should be recorded with the slice 1 operational
configuration. Cloudflare currently documents a 10 ms per-request CPU limit on
the free plan and a substantially larger paid-plan allowance, so the slice 2
preview benchmark remains a meaningful release gate:

- <https://developers.cloudflare.com/workers/platform/limits/>

## Full-design assessment

- **Goals and scope:** Account, profile, session, and progress goals are clear;
  recovery, social auth, uploads, analytics, and lesson-engine work remain
  explicitly out of scope.
- **Architecture and feasibility:** A same-origin Worker with selective
  Worker-first API routing, static SPA assets, and D1 matches the current
  application and keeps the route surface small. Cloudflare documents both
  selective SPA routing and transactional D1 batches.
- **Security and privacy:** Server-derived identity, prepared statements,
  request limits, origin checks, password and token handling, redacted logs,
  session revocation, account deletion, and data minimization form a coherent
  boundary. The design treats rate limiting as permissive abuse reduction rather
  than a strict security invariant.
- **Data integrity and API contracts:** Catalog-bounded progress, optimistic
  revisions, server timestamps, cascade deletion, stable error shapes, and
  corruption-tolerant client adapters give implementers deterministic behavior.
- **Migrations and operations:** Additive migrations, isolated environments,
  preview validation, bookmarks, cutover checks, and incident-only restoration
  provide a proportionate deployment and rollback strategy.
- **Validation:** Unit, local-D1 integration, browser/component, preview, build-
  target, accessibility, security-header, failure, and regression cases cover
  the significant risks.
- **Slice boundaries:** The six ordered slices have explicit ownership and
  exclusions. Each can be reviewed independently, and only slice 6 changes the
  canonical production origin.
- **Abstraction:** The explicit route table, platform-neutral shared constants,
  generic progress transport, and lesson-specific adapter avoid both page-level
  duplication and a premature universal lesson engine.

No new actionable blocking findings were identified.

## Verdict and gate recommendation

**Verdict: `APPROVED`**

Open the `design_approval` human gate. Do not begin implementation until explicit
human approval is supplied. After approval, the first legal implementation
slice is `cloudflare-runtime-schema` as defined in the authoritative design.
