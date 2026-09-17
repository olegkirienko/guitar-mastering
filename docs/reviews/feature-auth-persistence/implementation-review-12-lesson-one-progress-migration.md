# Implementation Review 12 — Lesson 1 progress migration

## Review metadata

- **Work item:** `feature-auth-persistence`
- **Work-item type:** `technical_feature`
- **Authoritative design:** `docs/technical-designs/feature-auth-persistence.md`
- **Approved amendment:** `railway-node-postgres-architecture-04`
- **Slice reviewed:** `lesson-one-progress-migration`
- **Prior review:** `docs/reviews/feature-auth-persistence/fix-rereview-11-progress-api-sync-core.md`
- **Workflow phase reviewed:** `implementation_review`
- **Current HEAD SHA:** `8c502ac4c5894d2fbec4496446794e6edd497f2a`
- **Date:** 2026-09-16
- **Verdict:** `CHANGES REQUIRED`

## Preflight

The workflow state is consistent and authorizes this implementation review. It
identifies the work item and technical-feature type, references the existing
approved design and amendments, uses canonical `phase: implementation_review`
with matching `next.phase`, has no open gate or blocking findings, and marks
`lesson-one-progress-migration` as implemented. All referenced artifacts exist.
The current slice exists in the approved design, and the later approved
`production-cutover-operations` slice is final, so this is not the final slice.

## Scope reviewed

The review covered the Lesson 1 local-storage adapter, legacy progress parsing,
device-local preferences, guest and user-scoped caches, confirmed guest import,
remote bootstrap, optimistic-conflict merging, queued API saves, sync status and
retry UI, logout/API-failure behavior, accessibility and responsive behavior,
browser/unit coverage, and repository validation gates. No application code was
changed during review.

## Assessment

- **Persistence and merge behavior:** The adapter sends only the four approved
  progress fields, preserves audio/motion preferences locally, scopes account
  caches by user ID, preserves guest data during authentication, and uses the
  approved monotonic merge rules. Revision conflicts merge the current server
  item before retrying at its revision.
- **Local-first and failure behavior:** Lesson actions write local state before
  queueing a remote save. The UI distinguishes guest/loading/unavailable and
  pending/synced/error states and exposes a retry action. Logout returns to the
  preserved guest cache rather than exposing another account's cache.
- **Guest import and UI:** Meaningful guest progress is never imported silently;
  the learner can merge it or keep it separate. The prompt uses headings, native
  buttons, text labels, focus-visible styling, and wrapping controls. The
  implementation still omits the approved shared-device clearing path described
  below.
- **Scope discipline and maintainability:** Lesson-specific validation, storage,
  and merge adaptation are separated from the reusable sync core and lesson UI.
  The slice does not implement production cutover operations.
- **Regression posture:** All repository commands pass, and focused browser
  tests prove confirmed guest merge, synced status, and one optimistic conflict.
  Required corruption, retry, cache-separation, offline resume, and new-UI mobile
  paths remain uncovered, and review found a corruption defect in one of those
  paths.

## Blocking findings

### MEDIUM-12 — Account progress caches cannot be cleared from a shared device

The approved client behavior requires user-ID-scoped account caches and an
explicit, confirmed shared-device clearing action. The implementation creates
the user-scoped progress and guest-import-decision keys, but neither the lesson
nor account UI provides a way to remove the current account's local cache. A
logout intentionally preserves device progress, and account deletion explicitly
tells the learner that local progress remains, so a learner using a shared
device has no supported way to remove that retained account data. This leaves an
approved privacy/device-lifecycle behavior incomplete.

Targeted fix: add a clearly labeled, confirmed action that removes only the
current user's Lesson 1 cache and its guest-import decision on this device,
without deleting server progress or another user's/guest cache. Refresh the
visible state from the still-authoritative account/server state as appropriate,
and add a browser regression proving confirmation, key scope, and non-deletion
of unrelated caches. Keep server account deletion and cutover scope unchanged.

### MEDIUM-13 — Corrupt preference JSON can overwrite valid guest progress

`readLessonOneProgress` parses the progress record and the independent
`guitar-mastering:lesson-preferences` record inside one `try`. If the progress
record is valid but the preference JSON is malformed, the shared catch returns
brand-new default progress and reports storage unavailable. The next learner
action can then successfully write that default-derived state over the valid
guest record, permanently losing completed steps. An auxiliary local preference
must not invalidate or replace valid lesson progress, especially because the
design requires malformed browser data to retain its safe progress fallback.

Targeted fix: isolate progress and preference parsing/fallbacks so malformed
preferences fall back to safe preference defaults while valid progress remains
intact. Preserve the existing legacy-progress and completion recovery behavior,
and add a regression that starts with valid completed progress plus malformed
preference data and proves completion survives reading and the next local save.

### MEDIUM-14 — The approved Lesson 1 browser acceptance matrix is incomplete

The design requires browser coverage for guest/offline use, progress
merge/status, Lesson 1 corruption/completion regression, accessibility/mobile,
and account cache behavior. The two new browser cases cover successful confirmed
guest import and one conflict retry, while an older case only proves that a
lesson page renders when session bootstrap fails. There is no browser proof that
guest progress saves and resumes offline, that a failed account save exposes and
successfully executes retry, that logout/login keeps guest and multiple user
caches isolated, that corrupt persisted data preserves a valid completion
fallback, or that the new import/save UI remains usable at 320 px. The pure
adapter tests do not exercise the React/auth/storage integration where these
regressions occur.

Targeted fix: extend the existing Chrome suite with focused end-to-end coverage
for offline guest save/resume; pending/error/retry status; guest and per-user
cache separation across auth transitions; malformed-storage completion recovery;
and keyboard/320 px behavior for the import and retry controls. Tests added for
`MEDIUM-12` and `MEDIUM-13` may satisfy overlapping parts of this matrix; avoid
duplicating scenarios or expanding into production cutover.

## Validation evidence

Executed with Node `v24.7.0` and pnpm `11.9.0`:

- `pnpm lint` — passed.
- `pnpm test` — passed: 13 files passed, 3 PostgreSQL-gated files skipped, 59
  tests passed, and 19 skipped.
- `TEST_DATABASE_URL=postgresql://... pnpm test:postgres` — passed against the
  local PostgreSQL service: 3 files and 19 tests passed.
- `pnpm test:browser` — passed in Chrome: 7 tests passed.
- `pnpm build:pages` — passed.
- `pnpm build:railway` — passed.
- `git diff --check` — passed.

## Verdict and transition

**Verdict: `CHANGES REQUIRED`**

Route to `fixes` for exactly `MEDIUM-12`, `MEDIUM-13`, and `MEDIUM-14`. Do not
open the `next_slice_approval` gate or begin `production-cutover-operations`
until all three findings pass targeted re-review.

## Exact verdict

CHANGES REQUIRED
