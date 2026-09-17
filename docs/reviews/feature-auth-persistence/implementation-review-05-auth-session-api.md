# Implementation Review 05 — Authentication and session API

## Review metadata

- **Work item:** `feature-auth-persistence`
- **Work-item type:** `technical_feature`
- **Authoritative design:** `docs/technical-designs/feature-auth-persistence.md`
- **Approved amendment:** `railway-node-postgres-architecture-04`
- **Slice reviewed:** `auth-session-api`
- **Prior review:** `docs/reviews/feature-auth-persistence/fix-rereview-04-railway-node-postgres-foundation.md`
- **Workflow phase reviewed:** `implementation_review`
- **Current HEAD SHA:** `8c502ac4c5894d2fbec4496446794e6edd497f2a`
- **Date:** 2026-09-16
- **Verdict:** `CHANGES REQUIRED`

## Preflight

The workflow state is consistent and authorizes this implementation review. It
identifies the work item and technical-feature type, references the existing
approved design and amendments, uses canonical `phase: implementation_review`
with matching `next.phase`, has no open gate or blocking findings, and marks
`auth-session-api` as implemented. The slice exists in the approved design, and
later approved slices begin with `account-profile-ui`.

## Scope reviewed

The review covered the Node Argon2id password policy and admission controller,
registration and login, dummy verification, PostgreSQL rate limiting, trusted
proxy-derived network keys, session creation/restoration/rotation/capping and
logout, password-confirmed account deletion, cookies, CSRF/media/body limits,
startup capability and legacy-hash gates, shutdown drain behavior, local and
PostgreSQL tests, Railway preview history/logs/metrics, and the durable KDF
acceptance record. No application code was changed during review.

## Assessment

- **Security and authentication:** New hashes use the approved `v4` Argon2id
  grammar and parameters with fresh salts and constant-time tag comparison.
  Unknown users and unusable records perform current-policy dummy work. The
  bounded two-active/eight-queued service rejects excess work before identifier
  lookup and drains admitted work during shutdown without a weaker fallback.
- **Sessions and account deletion:** Tokens contain 32 random bytes, only their
  SHA-256 digests are stored, secure deployments use the approved host-only
  cookie, login serializes session-cap changes under a user-row lock, logout is
  idempotent, and account deletion re-verifies the password before the
  cascading transaction.
- **Request boundary:** The implementation validates usernames and password
  sizes, requires matching origin and JSON for state-changing routes, limits
  JSON bodies, emits stable no-store JSON errors, derives coarse network keys
  from the configured trusted hop boundary, and HMACs both limiter dimensions.
- **Persistence and failure behavior:** Registration and destructive account
  work use explicit transactions. Atomic PostgreSQL upserts make limiter
  decisions replica-safe, and database/KDF failures are redacted behind the
  stable authentication-unavailable response.
- **Scope discipline and maintainability:** The slice adds only the approved
  auth/session/account behavior. Profile and progress behavior remain absent.
  Password, auth service, HTTP router, configuration, and persistence concerns
  remain separated without an auth framework or ORM.
- **Deployed behavior:** Railway history contains successful preview
  deployments and real auth traffic. The acceptance window shows registration,
  login/failure/session/logout/delete flows, expected overload responses,
  process restarts with recovery, and bounded resources. The 15:00–16:00 UTC
  service window peaked at about 0.154 vCPU and 412.9 MiB against a 1,024 MiB
  memory limit. This corroborates that an acceptance exercise occurred, but it
  does not replace the missing durable measurements identified below.

## Blocking findings

### MEDIUM-06 — The required Railway preview acceptance record still says the gate is pending

`docs/operations/auth-kdf-thresholds.md` is the designated acceptance artifact,
but its status and final paragraph explicitly say Railway preview acceptance is
pending. It records only local measurements. It does not record the deployed
service size and Node patch, exact-policy sequential and two-active p50/p95,
queue-drain result, event-loop delay, real/dummy/confirmation flow results,
trusted-ingress spoof proof, restart-persistent limits, cleanup counts, resource
inspection, log inspection, or a final pass/fail decision required by the
approved design. The workflow note saying that preview acceptance passed
therefore contradicts the durable artifact used to audit the gate.

Railway deployment history and bounded logs corroborate substantial parts of
the exercise, including the acceptance-tagged deployments, successful flows,
expected `503` load shedding, deliberate restarts/recovery, and safe resource
peaks. They do not reconstruct the missing KDF-specific percentile, queue,
event-loop, ingress, cleanup, and final decision record.

Targeted fix: update the durable acceptance artifact with the complete preview
report and reconcile its status with the workflow claim. Identify the exact
deployment/image, service allocation, Node patch, measurement window and all
required results without secrets. If any required value or proof was not
captured, rerun only the missing preview checks before marking the gate passed.

### MEDIUM-07 — The automated suite omits required auth security and PostgreSQL regression gates

The approved design explicitly requires unit/service fixed vectors and strict
format cases, rehash decisions, KDF failure/no-mutation behavior, limiter key
and atomic-counter decisions, and PostgreSQL acceptance for session rotation,
expiry and capping, rate-limit persistence/cleanup, transaction rollback,
pool/statement failures, and account cascades. The current suite proves the
happy-path `v4` round trip, one altered parameter, admission saturation/error
release, basic HTTP boundaries, concurrent registration, restart-safe session
lookup/logout, the ten-session count, and account deletion. It does not provide
the remaining mandated gates. In particular, self-generated hashes can verify
against the same implementation without proving the exact native Argon2 policy
against a fixed vector, while limiter cleanup/restart behavior and several
failure rollback invariants have no PostgreSQL regression coverage.

Targeted fix: add focused tests for the omitted approved contracts. At minimum,
cover an independently fixed exact-policy Argon2id vector and malformed-format
matrix; KDF/auth failure without user or session mutation; incoming-session
rotation, expiry, cap and logout behavior; stable HMAC dimensions plus atomic
limit thresholds, persistence and bounded cleanup; transaction and
pool/statement failures with rollback; and all owned-row cascades. Keep tests
within `auth-session-api` and do not implement profile, progress, or later
cutover behavior.

## Validation evidence

Executed with Node v24.7.0 and pnpm 11.9.0:

- `pnpm lint` — passed.
- `pnpm test` — passed: 9 files passed, 2 PostgreSQL-gated files skipped, 39
  tests passed, and 7 skipped.
- `TEST_DATABASE_URL=postgresql://... pnpm test:postgres` — passed against the
  local PostgreSQL service: 2 files and 7 tests passed.
- `pnpm build:pages` — passed.
- `pnpm build:railway` — passed.
- `git diff --check` — passed.
- Railway preview deployment history, bounded runtime logs, and the 15:00–16:00
  UTC CPU/memory/HTTP metric window — inspected read-only.

The green suite confirms the behavior it currently asserts, but it does not
satisfy the missing acceptance record and regression gates above.

## Verdict and transition

**Verdict: `CHANGES REQUIRED`**

Route to `fixes` for exactly `MEDIUM-06` and `MEDIUM-07`. Do not begin
`account-profile-ui` and do not open a next-slice human gate until both findings
pass targeted re-review.

## Exact verdict

CHANGES REQUIRED
