# Authentication and persistence foundation — `auth-session-api` Targeted Re-Review

## Review metadata

- **Review date:** 2026-09-16
- **Work item:** `feature-auth-persistence`
- **Work-item type:** `technical_feature`
- **Review scope:** targeted re-review of `MEDIUM-06` and `MEDIUM-07`
- **Current HEAD SHA:** `8c502ac4c5894d2fbec4496446794e6edd497f2a`
- **Authoritative design:** `docs/technical-designs/feature-auth-persistence.md`
- **Owning review:** `docs/reviews/feature-auth-persistence/implementation-review-05-auth-session-api.md`
- **Workflow state:** `docs/workflow/feature-auth-persistence.yaml`
- **Slice reviewed:** `auth-session-api`

## Preflight

The workflow state is consistent and authorizes targeted re-review. It identifies
the work item and type, references the existing approved design and review,
uses canonical `phase: fix_rereview` with matching `next.phase`, has no open
gate, marks the current slice as fixed, and lists exactly `MEDIUM-06` and
`MEDIUM-07` as active blocking findings. The approved design contains the
current slice and the later `account-profile-ui` slice.

## Final verdict

**APPROVED**

Both active findings are fixed. The fixes remain within the `auth-session-api`
slice and introduce no direct regression in authentication, session handling,
rate limiting, persistence, request boundaries, shutdown, or either deployment
build.

## Finding verification

### MEDIUM-06 — FIXED

- `docs/operations/auth-kdf-thresholds.md` now identifies the accepted Railway
  deployment, application version and image digest, Railway runtime and region,
  replica and service allocation, Node patch, architecture, and exact
  measurement window.
- The record includes independent exact-policy vector verification, sequential
  and two-active p50/p95 measurements, peak memory and event-loop delay, full
  queue drain, excess `AUTH_BUSY`, thrown-work permit release, and recovery.
- It records real, dummy, and confirmation work; public authentication and
  session flows; non-mutation behavior; trusted-ingress spoof resistance;
  restart-persistent rate limits; cleanup counts; structured-log inspection;
  platform metrics; and restart/5xx/OOM observations.
- The artifact ends with an explicit `PASS` decision and no longer contradicts
  the workflow's preview-acceptance claim.

### MEDIUM-07 — FIXED

- `server/password.test.ts` adds an independently fixed exact-policy Argon2id
  vector, strict malformed/unsupported-record cases, password-record status
  decisions, wrong-password behavior, bounded FIFO saturation, thrown-work
  recovery, and shutdown drain coverage.
- `server/auth.test.ts` proves admission rejection occurs before identifier
  lookup and that KDF failures create neither users nor sessions.
- `server/auth.integration.test.ts` covers incoming-session rotation, expiry,
  restart-safe lookup and logout, the concurrent ten-session cap, persistent
  atomic limiter thresholds and HMAC dimensions, bounded expired-row cleanup,
  transactional statement rollback, KDF failure without mutation, pool
  acquisition failure without mutation, and cascades for every owned row.
- The PostgreSQL-gated tests run under `REQUIRE_POSTGRES_TESTS=true`, so CI and
  explicit integration validation cannot silently skip these regression gates.

## Direct regression check

No direct regression was found. The complete local suite, PostgreSQL integration
suite, TypeScript validation, both deployment builds, and whitespace check pass.
The first sandboxed local-suite attempt was denied loopback binding with
`listen EPERM`; the permitted rerun outside that restriction passed.

## Validation results

Executed with Node `v24.7.0` and pnpm `11.9.0`:

- `pnpm lint`: passed.
- `pnpm test`: passed, 9 files passed, 2 PostgreSQL-gated files skipped, 48
  tests passed, and 12 skipped.
- `TEST_DATABASE_URL=postgresql://... pnpm test:postgres`: passed against the
  local PostgreSQL service, 2 files and 12 tests passed.
- `pnpm build:pages`: passed.
- `pnpm build:railway`: passed.
- `git diff --check`: passed.

## Transition

The approved design defines `account-profile-ui` after the current slice.
Transition to `human_gate / next_slice_approval` and wait for explicit approval
before archiving `auth-session-api` and beginning that slice.

## Exact verdict

APPROVED
