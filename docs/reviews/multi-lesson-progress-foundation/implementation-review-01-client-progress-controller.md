# Multi-lesson Progress Foundation — Client Progress Controller Implementation Review 01

## Review metadata

- Review date: 2026-09-30
- Work item: `multi-lesson-progress-foundation` (`technical_feature`)
- Slice: `client-progress-controller`
- Implementation SHA: `296f546fdc5dba07782015db8e9141cbfb98b63f`
- Canonical branch / lifecycle generation: `work/multi-lesson-progress-foundation` / `f9ee8628-7f3b-4241-bdfa-37c28392167d`
- Draft PR: `17`, targeting `main`
- Authoritative design: `docs/technical-designs/multi-lesson-progress-foundation.md`
- Prior review: `docs/reviews/multi-lesson-progress-foundation/design-review-01.md`
- Artifact identifier: `implementation-review-01-client-progress-controller`

## Preflight

`PREFLIGHT PASSED`. The fetched canonical branch, unique annotated lifecycle
registration, bootstrap target and ancestry, repository/work-item identity,
clean worktree, Draft PR head/target, current slice, and
`implementation_review / ready / none / review-client-progress-controller`
route agree. The implementation commit changes only the approved client slice,
its tests, and the workflow transition.

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

The implementation extracts the existing auth/bootstrap/import/cache/sync
lifecycle into `useLessonProgress` and keeps `useLessonOneProgress` as the
required thin compatibility wrapper. The structural adapter contains only the
approved persistence operations and metadata; lesson content, navigation, UI
copy, and server catalog behavior remain outside this slice.

`lessonOneProgressAdapter` composes the existing Lesson 1 functions without
changing guest, account, import-decision, or preference keys. Schema/content
versions, step normalization, completion repair, monotonic merge, earliest
completion, device-only preference projection, and page-facing controller
fields remain unchanged.

The generic controller uses adapter-owned lesson identity for API requests and
adapter-owned storage/import operations for local behavior. Each hook instance
owns its own API reference, queue, revision snapshot, and subscription. Queue
detachment on auth transitions plus user-ID guards prevent an old account queue
from issuing a conflict retry or receiving new values after the active account
changes.

## Scope, security, privacy, and compatibility

The diff does not modify Lesson 1 presentation, another lesson, server code,
routes, payloads, SQL, migrations, authentication, dependencies, provider
configuration, or deployment topology. Only `ProgressValue` reaches the API;
`audioEnabled` and `prefersStatic` remain local. Existing stored values require
no migration or eager rewrite.

Moving the structural adapter type into the non-React progress core avoids
pulling the auth `.tsx` graph into server/test TypeScript compilation. The hook
re-exports that type, preserving the design's intended client-facing contract
without adding a framework or runtime registry.

## Test and validation evidence

Focused coverage proves:

- legacy/corrupt Lesson 1 parsing and completion repair;
- device-only preferences and unchanged synchronized projection;
- exact Lesson 1 key compatibility;
- independent test-lesson guest, user, and import-decision identity;
- independent API targets and queue base/current revisions;
- existing queue coalescing, status, failure, and retry behavior.

Local Node `24.7.0` validation passed:

- `corepack pnpm lint`;
- `corepack pnpm test` — 75 passed, 19 PostgreSQL-gated skipped;
- `corepack pnpm build`;
- `corepack pnpm validate:workflow`;
- `git diff --check`.

The local PostgreSQL command was attempted and reported `ECONNREFUSED` because
no test database was listening on `127.0.0.1:5432`. Required GitHub PR run
`36692969795` then passed on the exact implementation SHA. Its `validate` job
passed workflow validation, lint/typecheck, unit/foundation tests, browser
regressions, all PostgreSQL integration tests, and the production build.

## Slice-boundary proof and route

The authoritative design contains a later approved slice,
`server-progress-catalog`. The current slice is therefore not final and cannot
route to merge approval. Enter `next_slice_approval`; only explicit approval
may archive `client-progress-controller` and begin
`server-progress-catalog`.

## Handoff notes

The next slice must remain server-only: extract and validate the immutable
typed catalog boundary, preserve the production Lesson 1 entry and all public
API/error/SQL behavior, and use a second entry only in tests. It must not alter
the approved client implementation or register Lesson 2 in production.
