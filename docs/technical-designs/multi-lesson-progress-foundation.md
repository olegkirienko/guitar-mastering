# Multi-lesson progress foundation

## Purpose and scope

The existing progress stack has the right persistence architecture: local-first
browser state, optional account synchronization through the same-origin API,
optimistic server revisions, monotonic conflict merging, and a PostgreSQL row
per user and lesson. The reusable API client and write queue already accept a
lesson ID and generic progress value. The remaining orchestration is embedded
in `useLessonOneProgress`, while the server owns a private one-entry catalog.

This work item generalizes those two seams so another approved lesson can opt
in with a concrete lesson definition. It preserves Lesson 1 behavior and the
current React/Express/PostgreSQL architecture. It is a foundation change, not a
lesson implementation or a new lesson framework.

## Goals

- Let a lesson supply its identity, versions, storage operations, parsing,
  normalization, merge, serialization, meaningful-progress check, and stable
  fingerprint to one reusable React synchronization controller.
- Preserve local-first rendering, guest mode, account-scoped caches, explicit
  guest import, optimistic conflict recovery, coalesced saves, retry, and sync
  status independently for every mounted lesson.
- Make server-side lesson registration an explicit typed catalog boundary that
  accepts more than one entry without changing the progress API or database.
- Keep all Lesson 1 storage keys, saved shapes, preferences, merge semantics,
  user-visible copy, and completed progress compatible.
- Prove multi-lesson isolation with a second test-only lesson definition rather
  than exposing an unfinished lesson to production requests.

## Non-goals

- Implementing Lesson 2, changing its approved pedagogy or slices, or making
  `/lessons/02` publicly available.
- Registering a production Lesson 2 progress contract before its page defines
  and owns the final step identifiers.
- Designing a universal lesson engine, reducer, navigation system, content
  schema, plugin registry, or cross-package metadata framework.
- Changing authentication, cookies, CSRF/origin rules, API routes, response or
  error envelopes, optimistic-revision semantics, PostgreSQL schema, or
  migration history.
- Synchronizing device preferences, transient interaction state, private
  reflections, audio playback state, or animation state to the server.
- Extracting the progress/import/cache status markup from Lesson 1. A shared UI
  primitive is justified only after another lesson demonstrates identical copy
  and interaction needs.
- Adding a dependency.

## Preserved user flows

### Guest and unavailable-account flow

The lesson renders its guest snapshot synchronously from its existing local
storage key. Progress updates are written locally before any remote work. An
unavailable session API remains different from a confirmed guest session, and
neither state prevents lesson use. Corrupt or unavailable storage continues to
fall back to the lesson definition's safe default and exposes the existing
storage-unavailable state.

### Authenticated bootstrap and save flow

For the current authenticated user, the controller reads the cache whose key
contains both the encoded user ID and lesson ID, then fetches that lesson's
remote item. It merges cached and remote progress through the lesson definition,
writes the merged value locally, and saves only when the synchronized projection
differs from the remote value. Later updates remain local-first and enter an
independent per-hook `ProgressSyncQueue`.

### Conflict, retry, and account transition flow

A `REVISION_CONFLICT` uses the current server item and the lesson definition's
merge function, replaces the current account cache, and retries once against
the returned revision. Network or server failure leaves the local value intact,
shows the existing error state, and retries either the failed queued value or
the bootstrap. Logout switches back to that lesson's guest snapshot. Switching
users cannot reuse the prior user's queue, revision, cache, or import decision.

### Guest import and shared-device clearing

The import prompt is scoped by both user and lesson. Confirming import merges
through the lesson definition and queues the result; declining records the
fingerprint of the current guest synchronized projection. Clearing an account
cache removes only the current user/lesson cache and its import decision. It
does not delete guest data, server data, another lesson, or another account.

## Client architecture

### Reusable controller contract

Add `src/progress/useLessonProgress.ts` with a generic hook and its narrow
adapter type. The adapter is structural and owned by each lesson; it contains
only operations the current Lesson 1 controller already needs:

```ts
type LessonProgressAdapter<StepId extends string, Local extends ProgressValue<StepId>> = {
  lessonId: string;
  schemaVersion: number;
  contentVersion: number;
  guestStorageKey: string;
  userStorageKey(userId: string): string;
  importDecisionKey(userId: string): string;
  read(key: string): { progress: Local; storageAvailable: boolean };
  write(key: string, progress: Local): boolean;
  parse(value: unknown): Local;
  toSynced(progress: Local): ProgressValue<StepId>;
  merge(local: Local, remote: ProgressValue<StepId>): Local;
  hasMeaningfulProgress(progress: Local): boolean;
  fingerprint(progress: Local): string;
};
```

`useLessonProgress(adapter)` returns the controller shape currently returned by
`useLessonOneProgress`, generalized over `Local`. It owns all auth transitions,
refs, effects, API bootstrap, queue subscription, conflict handling, import
decisions, cache clearing, and retry behavior. Each invocation creates or holds
its own API/queue lifecycle; there is no global current lesson or shared
revision.

The contract deliberately does not contain content, routes, titles, arbitrary
callbacks, UI strings, step navigation, or a registry. Lesson-specific parsing
and progression rules remain in the lesson adapter, where they can be reviewed
against that lesson's approved design.

### Lesson 1 compatibility adapter

Keep `src/progress/lesson-one.ts` as the Lesson 1 authority. Export a
`lessonOneProgressAdapter` composed from the existing constants and functions.
The existing `useLessonOneProgress` export remains as a thin compatibility
wrapper around `useLessonProgress(lessonOneProgressAdapter)`, so
`LessonOnePage` does not need a behavioral or presentational rewrite.

The migration must preserve exactly:

- guest key `guitar-mastering:stage-01-lesson-01`;
- user key `guitar-mastering:user:<encoded-user-id>:stage-01-lesson-01`;
- per-user import-decision key derived from that user/lesson key;
- shared preference key `guitar-mastering:lesson-preferences` and its current
  `audioEnabled` / `prefersStatic` fallback behavior;
- schema/content version `1`, step order, safe normalization, earliest
  completion time, checkpoint/completion repair, and synchronized projection;
- the existing controller return fields and Lesson 1 status/import/cache UX.

No bulk rewrite of local storage occurs. Existing values are parsed through the
same Lesson 1 functions on first read and rewritten only by normal user or merge
activity.

## Server architecture

### Typed catalog boundary

Move the catalog entry type and default catalog into
`server/progress-catalog.ts`. An entry contains only the server validation data
already present: `schemaVersion`, `contentVersion`, and an ordered non-empty
readonly set of unique step IDs. The production catalog initially contains the
existing Lesson 1 entry unchanged.

`ProgressService` receives a `ProgressCatalog` through an optional constructor
parameter whose default is the production catalog. Validation resolves entries
from that instance rather than from a module-private constant. Tests may inject
a second concrete entry; production code does not gain runtime registration,
mutable global state, dynamic imports, or client-supplied catalog metadata.

The catalog boundary validates its own static shape when constructed or
exported: lesson IDs and step IDs are non-empty, versions are non-negative
integers, step IDs are unique, and the catalog cannot be mutated through the
service. These checks prevent ambiguous validation behavior without imposing a
new domain model on lesson content.

When Lesson 2 later owns stable progress step IDs, its approved implementation
can add one ordinary catalog entry and its client adapter. No change to the
service algorithm, routes, database, or reusable hook should then be required.

### API and data contracts

The public contracts remain unchanged:

- `GET /api/v1/progress`
- `GET /api/v1/progress/:lessonId`
- `PUT /api/v1/progress/:lessonId`
- `ProgressItem`, `SaveProgress`, and the stable JSON error envelope
- `404 UNKNOWN_LESSON` before authentication or SQL for unregistered IDs
- `422 INVALID_PROGRESS` / `UNSUPPORTED_PROGRESS_VERSION` validation behavior
- `409 REVISION_CONFLICT` with the durable current item
- 12 KiB application bound and the existing PostgreSQL size constraint

The `lesson_progress` primary key already scopes rows by `(user_id, lesson_id)`.
No migration or data rewrite is required. Listing continues to return the
authenticated user's persisted items ordered by lesson ID.

## Trust, privacy, and failure boundaries

- The server catalog remains authoritative. A lesson ID, versions, and step IDs
  supplied by a browser never define or extend accepted server data.
- Authentication and per-user SQL predicates remain the isolation boundary;
  adapter configuration cannot select another account's data.
- Local keys include lesson identity and, for account caches, encoded user
  identity. Guest data remains device-scoped and import remains explicit.
- Only the synchronized `ProgressValue` projection reaches the API. Device
  preferences and other lesson-local fields remain local.
- A malformed local record is handled by that lesson's parser. A malformed
  remote payload remains subject to server validation and existing client error
  handling; this work does not silently trust arbitrary remote fields.
- Stale async bootstrap work must check the active user before replacing local
  state or publishing queue results. Cleanup unsubscribes the prior queue on
  user/lesson lifecycle changes.
- Concurrent lessons use separate queues and revisions. A failure or retry in
  one lesson cannot set another lesson's sync status or overwrite its cache.

## Accessibility and UI impact

This foundation introduces no new visible control or copy. Lesson 1 retains its
current polite sync status, explicit retry, import question, confirmed cache
clearing, keyboard targets, and mobile layout. Future lessons consume the
controller state but remain responsible for accessible presentation in their
own reviewed slices. Tests must ensure the refactor does not remove or rename
the Lesson 1 controller fields used by the page.

## Validation and error handling

- Adapter keys and lesson identity are stable for the lifetime of a mounted
  hook. Callers pass a module-level adapter, not an object rebuilt on render.
- The reusable controller treats a missing progress item as first-save state,
  preserves other bootstrap failures as visible errors, and never deletes a
  valid local snapshot in response to auth or API failure.
- Queue behavior remains last-value coalescing with one active request and the
  latest failed value available for retry.
- Server catalog lookup still happens before authentication and SQL, preserving
  the existing information and work boundary for unknown lessons.
- Invalid catalog definitions fail during construction/test startup rather than
  weakening request validation.

## Test strategy

### Client tests

- Keep the existing Lesson 1 corruption, completion repair, shared preference,
  account-key, import-fingerprint, merge, and queue tests green.
- Add focused tests for generic storage/import key isolation across two lesson
  IDs and two user IDs where those helpers are extracted.
- Test the reusable controller logic through extracted pure helpers where useful
  and through the existing build acceptance style; do not add a hook-testing
  dependency solely for this refactor.
- Prove two concrete adapters produce independent lesson IDs, storage keys,
  fingerprints, API targets, and queue revisions.
- Preserve a source/build acceptance assertion that `LessonOnePage` continues
  through `useLessonOneProgress` and exposes the existing status, retry, import,
  and cache controls.

### Server tests

- Keep unknown-lesson-before-authentication, versions, fields, step validation,
  size, isolation, optimistic concurrency, and account cascade tests green.
- Inject a two-entry test catalog and prove both entries can validate and
  persist for one user as distinct rows returned in lesson-ID order.
- Prove an alternate lesson uses its own versions and step set; values valid for
  Lesson 1 are rejected for that entry and vice versa.
- Reject duplicate/empty step IDs and invalid versions in catalog definitions.
- Run PostgreSQL integration tests against the unchanged composite key; no new
  migration test is expected.

### Required validation

Each implementation slice runs with Node `24.7.0`:

- `corepack pnpm lint`
- `corepack pnpm test`
- `TEST_DATABASE_URL=... corepack pnpm test:postgres` when the local test
  database is available under the repository's normal test setup
- `corepack pnpm build`
- `git diff --check`

The final slice also runs `corepack pnpm test:browser` because Lesson 1's
authenticated progress UI is an end-to-end compatibility boundary.

## Runtime, deployment, migration, and rollback

There is no database migration, environment variable, secret, provider change,
new endpoint, or deployment topology change. The feature deploys as ordinary
application code after the existing CI and delivery gates.

Rollback is a normal application rollback because stored keys, JSON payloads,
API contracts, and database rows remain backward compatible. No cleanup is
required. If a future lesson entry is faulty, removing only that entry and its
lesson integration is sufficient; this foundation does not mutate existing
Lesson 1 records into a new format.

## Implementation slices

### 1. `client-progress-controller`

Create the narrow `LessonProgressAdapter` and reusable `useLessonProgress`
controller. Compose the current Lesson 1 functions into
`lessonOneProgressAdapter`, retain `useLessonOneProgress` as the page-facing
wrapper, and preserve all existing local keys, parsing, preferences, merge,
import, cache, sync, retry, and UI behavior. Add multi-adapter isolation and
compatibility coverage. Do not change server code, API contracts, Lesson 1 UI,
or any other lesson.

Acceptance:

- Lesson 1 resumes every existing guest/account snapshot without a migration.
- Its synchronized payload excludes device-only preferences exactly as before.
- Auth transitions, conflict merge, retry, import decision, and cache clearing
  are driven by the supplied adapter rather than Lesson 1 constants.
- Two test definitions have isolated lesson/user keys and synchronization
  identity; no global current lesson or revision exists.
- Existing Lesson 1 and progress-sync tests remain green.

### 2. `server-progress-catalog`

Extract the immutable typed server catalog boundary, inject it into
`ProgressService` with the current production catalog as default, and add
two-entry unit/PostgreSQL coverage. Keep only Lesson 1 registered in production
until another lesson's own approved implementation supplies stable step IDs.
Do not change routes, payloads, SQL schema, migrations, auth, or client code.

Acceptance:

- Production Lesson 1 accepts and rejects the same requests and preserves the
  same error ordering and status codes.
- A two-entry test catalog persists and lists independent rows and validates
  each lesson against only its own versions and steps.
- Invalid catalog construction fails closed.
- All repository validation, PostgreSQL integration, browser compatibility,
  build, and diff checks pass without a new dependency.

This second slice is final for the work item. Registering or presenting Lesson
2 remains owned by the separate Lesson 2 workflow.
