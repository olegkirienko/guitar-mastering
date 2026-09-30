# Multi-lesson Progress Foundation — Server Progress Catalog Implementation Review 02

## Review metadata

- Review date: 2026-09-30
- Work item: `multi-lesson-progress-foundation` (`technical_feature`)
- Slice: `server-progress-catalog`
- Reviewed implementation SHA: `8f771c87e1f4c99474964ab5f7ea056075c7c9c1`
- Canonical branch / lifecycle generation: `work/multi-lesson-progress-foundation` / `f9ee8628-7f3b-4241-bdfa-37c28392167d`
- Draft PR: `17`, targeting `main`
- Authoritative design: `docs/technical-designs/multi-lesson-progress-foundation.md`
- Prior review: `docs/reviews/multi-lesson-progress-foundation/implementation-review-01-client-progress-controller.md`
- Artifact identifier: `implementation-review-02-server-progress-catalog`

## Preflight

`PREFLIGHT PASSED`. The fetched canonical branch, unique annotated lifecycle
registration, bootstrap target and ancestry, repository/work-item identity,
clean worktree, Draft PR head/target, current slice, and
`implementation_review / ready / none / review-server-progress-catalog` route
agree. The reviewed commit changes only the approved server catalog slice, its
tests, and the workflow transition.

## Final verdict

**APPROVED**

## Findings

### Critical

None.

### High

None.

### Medium

None.

### Low

None.

## Design compliance and correctness

The implementation extracts the production Lesson 1 definition into a typed
`ProgressCatalog` boundary and injects that catalog into `ProgressService` with
the one-entry production catalog as its default. Catalog construction copies
and freezes each entry and ordered step list behind a private map, so callers
cannot mutate the validation data through the service.

Construction fails closed for empty lesson IDs, invalid non-negative integer
versions, empty step sets, empty step IDs, and duplicate step IDs. Service
lookup remains before authentication and SQL for `get` and before payload,
authentication, and SQL processing for `put`, preserving the existing unknown
lesson boundary and error ordering. Lesson 1 retains the same versions and
ordered step IDs.

## Persistence, API compatibility, and scope

The change does not modify routes, request/response shapes, error envelopes,
authentication, SQL statements, migrations, database constraints, or client
code. The composite `(user_id, lesson_id)` key and ordered list query remain
unchanged. A second catalog entry exists only in tests; no unfinished lesson is
registered in production.

Focused unit coverage proves per-entry version and step isolation and rejects
invalid catalog definitions before SQL. PostgreSQL coverage injects two entries,
persists both for one account as independent rows, verifies lesson-ID ordering,
and proves cross-entry steps are rejected.

## Validation evidence

Local Node `24.7.0` validation passed:

- `corepack pnpm lint`;
- `corepack pnpm test` — 82 passed, 20 PostgreSQL-gated skipped;
- `corepack pnpm test:browser` — 10 passed;
- `corepack pnpm build`;
- `corepack pnpm validate:workflow` — 10 repository workflows verified;
- `git diff --check`.

The explicit local PostgreSQL command could not connect because no service was
listening on `127.0.0.1:5432`; it failed with `ECONNREFUSED` before assertions.
Required GitHub PR run `36694058644` then passed on the exact reviewed SHA. Its
`validate` job passed workflow validation, lint/typecheck, unit/foundation
tests, all 10 browser regressions, fresh PostgreSQL integration tests, and the
production build.

## Final-slice proof and route

The authoritative design identifies `server-progress-catalog` as the second
and final implementation slice. Under the v3.1 delivery contract, route to the
scoped `merge_approval` human gate with reviewed SHA
`8f771c87e1f4c99474964ab5f7ea056075c7c9c1`. Merge approval must dynamically
re-resolve the current PR head and required checks and may proceed only if any
commits after the reviewed SHA contain approved same-item control-plane
artifacts.
