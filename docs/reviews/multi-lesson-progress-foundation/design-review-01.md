# Multi-lesson Progress Foundation — Design Review 01

## Review metadata

- Review date: 2026-09-30
- Work item: `multi-lesson-progress-foundation` (`technical_feature`)
- Review scope: initial technical design
- Current HEAD SHA: `ee513cc4e8dda49b74fa5256cfa29207963ec9cd`
- Canonical branch / lifecycle generation: `work/multi-lesson-progress-foundation` / `f9ee8628-7f3b-4241-bdfa-37c28392167d`
- Draft PR: `17`, targeting `main`
- Authoritative design: `docs/technical-designs/multi-lesson-progress-foundation.md`
- Artifact identifier: `design-review-01`

## Preflight

`PREFLIGHT PASSED`. The fetched canonical branch, unique annotated lifecycle
registration, bootstrap target and ancestry, repository/work-item identity,
workflow design path, Draft PR head/target, clean worktree, and
`design_review / ready / none / review-design` route agree.

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

## Technical-feature assessment

The design identifies the actual lesson-specific seams without treating the
whole lesson system as a framework problem. The API client, write queue,
optimistic revision model, database key, and public routes remain unchanged.
The proposed client adapter contains only operations already required by the
Lesson 1 controller, while parsing, normalization, step rules, and merge policy
remain lesson-owned.

The server boundary remains authoritative and closed to browser-defined
metadata. Constructor injection is limited to a typed immutable catalog with a
production default, which makes multi-entry validation testable without
prematurely exposing an unfinished Lesson 2 contract. Authentication,
per-user SQL predicates, payload limits, error ordering, and optimistic
conflict behavior remain intact.

## Compatibility, integrity, and privacy assessment

The design pins every existing Lesson 1 storage key, synchronized shape,
device-only preference rule, version, merge invariant, import decision, and
page-facing controller field. It requires no bulk local-storage rewrite or
database migration. Account and lesson identities remain part of cache/import
keys, and concurrent lesson instances retain independent queue revisions and
status.

Only the existing synchronized projection reaches the server. Private or
transient lesson state and device preferences remain local. Normal application
rollback is sufficient because stored data and public contracts do not change.

## Scope and abstraction assessment

The two slices are coherent and non-overlapping:

1. `client-progress-controller` owns the generic React lifecycle and the
   behavior-preserving Lesson 1 adapter migration.
2. `server-progress-catalog` owns the typed catalog boundary and multi-entry
   service/database proof.

The design explicitly excludes Lesson 2 implementation, a universal lesson
engine, runtime plugin registration, shared presentation abstractions, new
dependencies, and deployment/provider changes. Keeping the production catalog
at Lesson 1 until a lesson owns stable step identifiers is the correct
non-speculative boundary.

## Validation assessment

The test plan covers corrupt and legacy local data, synchronized projection,
user/lesson key isolation, independent queues/revisions, conflict/retry paths,
unknown-lesson ordering, catalog definition failures, per-entry versions and
steps, PostgreSQL row isolation, browser compatibility, lint, builds, and diff
checks. The unchanged database schema and composite primary key are sufficient;
no migration test beyond the existing suite is required.

## Recommended next action

Request explicit `design_approval` for the first approved slice,
`client-progress-controller`. This review does not authorize implementation.

## Handoff notes

Implementation must preserve the exact Lesson 1 keys and behavior. It must not
register Lesson 2 in production, alter page UI, add a generic content/navigation
framework, or include server work in the first slice.
