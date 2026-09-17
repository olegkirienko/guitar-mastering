# Implementation Review 03 — Railway Node/PostgreSQL foundation

## Review metadata

- **Work item:** `feature-auth-persistence`
- **Work-item type:** `technical_feature`
- **Authoritative design:** `docs/technical-designs/feature-auth-persistence.md`
- **Approved amendment:** `railway-node-postgres-architecture-04`
- **Slice reviewed:** `railway-node-postgres-foundation`
- **Prior review:** `docs/reviews/feature-auth-persistence/design-review-07.md`
- **Workflow phase reviewed:** `implementation_review`
- **Date:** 2026-09-15
- **Verdict:** `CHANGES REQUIRED`

## Preflight

The workflow state is consistent and authorizes this implementation review. It
identifies the work item and technical-feature type, references the existing
approved design and amendments, uses canonical `phase: implementation_review`
with matching `next.phase`, has no open gate or blocking findings, and marks
`railway-node-postgres-foundation` as implemented. The slice exists in the
approved amendment, and later approved slices begin with `auth-session-api`.

## Scope reviewed

The review covered the replacement Node/Express runtime, static and API
routing, process shutdown, typed configuration, PostgreSQL pool and baseline
migration, migration serialization and rollback coverage, local Compose setup,
Railway configuration, CI, deployment-target capability gates, retirement of
Worker/D1 artifacts, KDF threshold documentation, and the associated tests and
operator documentation. No application code was changed during review.

## Assessment

- **Architecture and scope discipline:** The implementation cleanly replaces
  the superseded Worker/D1 foundation without retaining runtime dependencies or
  exposing credentials, profile, or progress endpoints. One Express service
  serves the root-base Railway SPA and JSON API while the Pages build remains
  account-free and rooted at `/guitar-mastering/`.
- **Runtime correctness:** Liveness is independent of PostgreSQL; readiness
  executes `SELECT 1`; known unsupported methods and unknown API paths retain
  JSON responses; immutable Vite assets and revalidated SPA fallbacks are
  separated; startup listens on `PORT`; and shutdown stops the HTTP server and
  closes the pool once.
- **Configuration and security:** Required runtime variables are typed and
  bounded. Production fails closed without HTTPS and secure-cookie mode, the
  rate-limit HMAC key has a minimum byte length, PostgreSQL URLs are validated,
  secrets remain absent from the key-only example, and readiness failures are
  redacted behind the stable error envelope.
- **Persistence and migrations:** The PostgreSQL migration creates the five
  approved domain tables with UUID, `timestamptz`, `bytea`, and `jsonb` types,
  ownership cascades, uniqueness, size, revision, expiry, and session-token
  constraints plus the required indexes. The runner uses an advisory lock and
  one transaction for the complete pending set. Fresh-schema, repeat/concurrent
  runner, and rollback acceptance all pass against PostgreSQL 17.
- **Builds and compatibility:** Node is pinned to 24.7.0 locally and constrained
  to the approved Node 24 range. TypeScript checks the browser, build tooling,
  and server projects. Both Pages and Railway builds compile through the real
  Vite configuration, and the acceptance fixture proves the target/base and
  account-capability boundary.
- **Maintainability:** Server configuration, database construction, HTTP error
  handling, application routing, and shutdown are small separated modules.
  Express, `pg`, explicit SQL, and `node-pg-migrate` match the approved
  conventional architecture without adding an ORM or unrelated framework.

## Blocking findings

### MEDIUM-04 — Railway promotes a deployment without proving database readiness

`railway.json` configures `healthcheckPath` as `/api/v1/health`. That endpoint
deliberately never touches PostgreSQL, so a deployment with an unreachable or
misconfigured database can return `200` and be made active. The approved design
requires the Railway deployment to check readiness before traffic shifts and
defines `/api/v1/readiness` as the short `SELECT 1` gate. A successful
pre-deploy migration does not replace the post-start readiness proof because it
runs in a separate container and cannot prove the web process can acquire and
use its configured pool.

Targeted fix: configure Railway's deploy healthcheck to use
`/api/v1/readiness`, and add an automated configuration assertion so it cannot
silently regress to liveness. Keep `/api/v1/health` database-independent for
liveness and external monitoring.

### MEDIUM-05 — Production logs do not satisfy the structured JSON contract

`server/app.ts`, `server/main.ts`, and `server/shutdown.ts` pass JavaScript
objects directly to `console.log`. Node renders those as inspection text rather
than guaranteed parseable JSON lines. Request entries also omit the required
application identifier and coarse outcome. This breaks the approved operational
contract used to derive route/status/outcome trends from Railway logs and makes
the later monitoring acceptance non-deterministic.

Targeted fix: add one redacting JSON-line logger used by request, startup, and
shutdown events; include a stable application identifier and a bounded coarse
outcome on request records; and add tests that parse emitted lines and assert
the required fields without leaking URLs, secrets, bodies, or thrown error
contents.

## Validation evidence

Executed with Node v24.7.0 and pnpm 11.9.0:

- `pnpm lint` — passed.
- `pnpm test` — passed outside the filesystem sandbox: 5 files passed, 1
  PostgreSQL-gated file skipped, 21 tests passed, 3 skipped. The initial
  sandboxed attempt failed only because loopback `listen` calls were denied with
  `EPERM`.
- `TEST_DATABASE_URL=postgresql://... pnpm test:postgres` — passed against the
  repository PostgreSQL 17 Compose service: 1 file and 3 tests passed.
- `pnpm build:pages` — passed.
- `pnpm build:railway` — passed.
- `git diff --check` — passed.

The green suite confirms the implemented behaviors it asserts, but it does not
cover the two deployment/observability contract failures above.

## Verdict and transition

**Verdict: `CHANGES REQUIRED`**

Route to `fixes` for exactly `MEDIUM-04` and `MEDIUM-05`. Do not begin
`auth-session-api` and do not open a next-slice human gate until both findings
pass targeted re-review.

## Exact verdict

CHANGES REQUIRED
