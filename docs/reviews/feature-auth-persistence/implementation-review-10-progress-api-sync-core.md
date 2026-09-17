# Implementation Review 10 — Progress API and sync core

## Review metadata

- **Work item:** `feature-auth-persistence`
- **Work-item type:** `technical_feature`
- **Authoritative design:** `docs/technical-designs/feature-auth-persistence.md`
- **Approved amendment:** `railway-node-postgres-architecture-04`
- **Slice reviewed:** `progress-api-sync-core`
- **Prior review:** `docs/reviews/feature-auth-persistence/fix-rereview-09-account-profile-ui.md`
- **Workflow phase reviewed:** `implementation_review`
- **Current HEAD SHA:** `8c502ac4c5894d2fbec4496446794e6edd497f2a`
- **Date:** 2026-09-16
- **Verdict:** `CHANGES REQUIRED`

## Preflight

The workflow state is consistent and authorizes this implementation review. It
identifies the work item and technical-feature type, references the existing
approved design and amendments, uses canonical `phase: implementation_review`
with matching `next.phase`, has no open gate or blocking findings, and marks
`progress-api-sync-core` as implemented. All referenced artifacts exist. The
slice exists in the approved design, and the later approved slices are
`lesson-one-progress-migration` and `production-cutover-operations`, so this is
not the final slice.

## Scope reviewed

The review covered the authenticated PostgreSQL progress service and HTTP
routes, catalog and version validation, per-user ownership, optimistic revision
writes and conflict responses, the browser API adapter, monotonic merge logic,
the coalescing sync queue, status/retry behavior, database acceptance coverage,
and the repository validation gates. No application code was changed during
review.

## Assessment

- **Persistence and authorization:** Progress reads and writes resolve the
  authenticated user through the existing session service and include the user
  identifier in every database lookup or mutation. The PostgreSQL acceptance
  proves isolation, insert/update/list/read behavior, and a one-winner
  optimistic-concurrency race.
- **API contract and validation:** The endpoints use the approved paths and
  stable error envelope, inherit the existing origin/media protections, return
  current durable data on a revision conflict, reject unknown lessons before
  SQL, and validate the current catalog, versions, fields, and basic value
  types before persistence.
- **Client sync core:** The API adapter preserves revision-conflict data, the
  merge helper unions completed steps, ORs the checkpoint result, retains the
  earliest completion, and chooses the furthest ordered step. The queue
  coalesces whole-progress snapshots, advances revisions from successful
  writes, exposes pending/synced/error states, and retries the latest failed
  snapshot.
- **Scope discipline and maintainability:** The server domain logic, HTTP
  boundary, and generic client utilities are separated. The slice does not wire
  Lesson 1 storage/import/UI behavior or production cutover operations owned by
  later slices.
- **Regression posture:** TypeScript, unit/service tests, PostgreSQL integration
  tests, Chrome browser tests, both deployment builds, and whitespace checks
  pass. The required PostgreSQL size/catalog-bound acceptance is incomplete as
  described below.

## Blocking findings

### MEDIUM-11 — Required PostgreSQL size and catalog-bound acceptance is missing

The approved design requires PostgreSQL integration coverage for progress
concurrency, isolation, size, and catalog bounds. The new integration file proves
concurrency and isolation, plus normal CRUD and authentication, but it never
exercises the database size constraint or rejected catalog/version/value bounds.
The small unit validation test checks an unknown current step and one unsupported
version, but it does not establish the committed PostgreSQL acceptance gate
specified by the design or prove that rejected boundary payloads leave durable
state unchanged. A regression in the service-to-database boundary or the
`lesson_progress_size` constraint could therefore pass the required review
command unnoticed.

Targeted fix: extend the progress PostgreSQL acceptance coverage to prove the
checked-in size constraint and representative catalog boundaries, including an
unknown lesson/step or unsupported version, and assert rejected writes do not
create or alter progress rows. Include the duplicate/out-of-catalog completion
and invalid completion-value boundaries where appropriate. Keep the fix limited
to `MEDIUM-11`; change production code only if the new acceptance reveals a
direct defect.

## Validation evidence

Executed with Node `v24.7.0` and pnpm `11.9.0`:

- `pnpm lint` — passed.
- `pnpm test` — passed outside the restricted network sandbox: 12 files passed,
  3 PostgreSQL-gated files skipped, 56 tests passed, and 17 skipped.
- `TEST_DATABASE_URL=postgresql://... pnpm test:postgres` — passed against the
  local PostgreSQL service: 3 files and 17 tests passed.
- `pnpm test:browser` — passed in Chrome: 5 tests passed.
- `pnpm build:pages` — passed.
- `pnpm build:railway` — passed.
- `git diff --check` — passed.

The first sandboxed unit/service attempt was denied loopback binding with
`listen EPERM`; the permitted rerun outside that restriction passed.

## Verdict and transition

**Verdict: `CHANGES REQUIRED`**

Route to `fixes` for exactly `MEDIUM-11`. Do not open the
`next_slice_approval` gate or begin `lesson-one-progress-migration` until this
finding passes targeted re-review.

## Exact verdict

CHANGES REQUIRED
