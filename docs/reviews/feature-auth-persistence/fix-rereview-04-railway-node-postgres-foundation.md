# Authentication and persistence foundation — `railway-node-postgres-foundation` Targeted Re-Review

## Review metadata

- **Review date:** 2026-09-15
- **Work item:** `feature-auth-persistence`
- **Work-item type:** `technical_feature`
- **Review scope:** targeted re-review of `MEDIUM-04` and `MEDIUM-05`
- **Current HEAD SHA:** `8c502ac4c5894d2fbec4496446794e6edd497f2a`
- **Authoritative design:** `docs/technical-designs/feature-auth-persistence.md`
- **Owning review:** `docs/reviews/feature-auth-persistence/implementation-review-03-railway-node-postgres-foundation.md`
- **Workflow state:** `docs/workflow/feature-auth-persistence.yaml`
- **Slice reviewed:** `railway-node-postgres-foundation`

## Preflight

The workflow state is consistent and authorizes targeted re-review. It identifies
the work item and type, references the existing approved design and review,
uses canonical `phase: fix_rereview` with matching `next.phase`, has no open
gate, marks the current slice as fixed, and lists exactly `MEDIUM-04` and
`MEDIUM-05` as active blocking findings. The approved design contains both the
current slice and the later `auth-session-api` slice.

## Final verdict

**APPROVED**

Both active findings are fixed. The fixes remain within the replacement
foundation slice and introduce no direct regression in routing, shutdown,
configuration, persistence, deployment-target behavior, or builds.

## Finding verification

### MEDIUM-04 — FIXED

- `railway.json` now configures `deploy.healthcheckPath` as
  `/api/v1/readiness`, so promotion depends on the web process completing its
  bounded PostgreSQL probe rather than database-independent liveness.
- `/api/v1/health` remains database-independent for liveness and external
  monitoring.
- `build/foundation.acceptance.test.ts` parses the deployed Railway
  configuration and asserts the readiness path, preventing a silent regression
  to the liveness endpoint.

### MEDIUM-05 — FIXED

- `server/logger.ts` is the single logger used by request, startup, and shutdown
  paths and serializes each allowlisted record with `JSON.stringify`, producing
  parseable JSON lines.
- Every record includes the stable `guitar-mastering` application identifier.
  Request records contain route, status, deployment version, and the bounded
  `success`, `client_error`, or `server_error` outcome.
- Request routes are reduced to the two known foundation endpoints, `/api/*`,
  or `/*`; the logger never serializes request URLs, headers, bodies, thrown
  errors, database URLs, or public origins.
- `server/logger.test.ts` parses emitted records, verifies the required fields
  and outcome boundaries, and proves secret-bearing extra properties and error
  contents are excluded.

## Direct regression check

No direct regression was found. The complete repository test suite, the
PostgreSQL migration suite, both deployment builds, TypeScript validation, and
the whitespace check pass. Existing liveness/readiness behavior and graceful
shutdown coverage remain green.

## Validation results

Executed with Node `v24.7.0` and pnpm `11.9.0`:

- `pnpm lint`: passed.
- `pnpm test`: passed, 6 files passed, 1 PostgreSQL-gated file skipped, 29 tests
  passed, and 3 skipped.
- `TEST_DATABASE_URL=postgresql://... pnpm test:postgres`: passed against the
  local PostgreSQL service, 1 file and 3 tests passed. The sandboxed attempt was
  denied only by loopback `EPERM`; the permitted rerun passed.
- `pnpm build:pages`: passed.
- `pnpm build:railway`: passed.
- `git diff --check`: passed.

## Transition

The approved design defines `auth-session-api` after the current slice.
Transition to `human_gate / next_slice_approval` and wait for explicit approval
before archiving `railway-node-postgres-foundation` and beginning that slice.

## Exact verdict

APPROVED
