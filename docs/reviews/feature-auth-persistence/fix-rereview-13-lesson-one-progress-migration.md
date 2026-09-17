# Targeted Re-Review 13 — Lesson 1 progress migration

## Review metadata

- **Work item:** `feature-auth-persistence`
- **Work-item type:** `technical_feature`
- **Authoritative design:** `docs/technical-designs/feature-auth-persistence.md`
- **Owning review:** `docs/reviews/feature-auth-persistence/implementation-review-12-lesson-one-progress-migration.md`
- **Workflow state:** `docs/workflow/feature-auth-persistence.yaml`
- **Slice reviewed:** `lesson-one-progress-migration`
- **Active findings reviewed:** `MEDIUM-12`, `MEDIUM-13`, `MEDIUM-14`
- **Current HEAD SHA:** `8c502ac4c5894d2fbec4496446794e6edd497f2a`
- **Date:** 2026-09-17

## Preflight

The workflow state is consistent and authorizes targeted re-review. It
identifies the work item and technical-feature type, references the approved
design and owning implementation review, uses canonical `phase: fix_rereview`
with matching `next.phase`, has no open gate, marks
`lesson-one-progress-migration` as fixed, and lists exactly `MEDIUM-12`,
`MEDIUM-13`, and `MEDIUM-14` as active. The design contains the later approved
`production-cutover-operations` slice, which is final.

## Final verdict

**APPROVED**

All three active findings are fixed. The current account's cache can be cleared
through a confirmed, precisely scoped action; malformed preference data no
longer invalidates valid progress; and the Chrome suite now covers the required
Lesson 1 offline, retry, cache-isolation, corruption/completion, keyboard, and
mobile paths. No direct regression was found.

## Finding verification

### MEDIUM-12 — FIXED

- The authenticated Lesson 1 UI explains the local-only effect and requires a
  second explicit confirmation before clearing.
- The clear operation removes only the current user's Lesson 1 cache and that
  user's guest-import decision. It leaves server progress, the guest cache,
  device-local preferences, and other users' caches untouched.
- Clearing is disabled while synchronization is pending, preventing accepted
  in-flight work from immediately recreating the cache during the action.
- Browser coverage verifies both target keys are removed, unrelated keys remain,
  logout restores the guest cache, and a later account restores its own cache.

### MEDIUM-13 — FIXED

- Storage access, progress JSON parsing, and preference JSON parsing now have
  separate failure boundaries.
- Malformed preferences use safe `false` defaults while valid progress and its
  completion timestamp remain intact and storage remains usable.
- Unit coverage proves a subsequent local write retains the valid completion;
  Chrome coverage proves the completed lesson survives a real UI write and
  reload while session bootstrap is offline.

### MEDIUM-14 — FIXED

- Chrome now proves offline guest completion save/resume with corrupt auxiliary
  storage and no horizontal overflow at 320 px.
- It proves pending, error, keyboard retry, successful recovery, and 320 px
  layout for account synchronization.
- It proves keyboard-confirmed guest import and responsive import UI.
- It proves confirmed current-user cache clearing and guest/multiple-account
  isolation across logout and later login.
- Existing browser cases continue to cover restored sessions, account/profile/
  deletion flows, guest/API outage continuity, and Pages/Railway capability
  separation.

## Direct regression check

No direct regression was found. The local-first adapter still sends only the
approved progress fields, keeps preferences device-local, preserves confirmed
guest merge and optimistic conflict handling, and remains usable in guest mode.
The fixes do not introduce production cutover work.

## Validation results

Executed with Node `v24.7.0` and pnpm `11.9.0`:

- `pnpm lint`: passed.
- `pnpm test`: passed, 13 files passed, 3 PostgreSQL-gated files skipped, 60
  tests passed, and 19 skipped.
- `TEST_DATABASE_URL=postgresql://... pnpm test:postgres`: passed against the
  local PostgreSQL service, 3 files and 19 tests passed.
- `pnpm test:browser`: passed in Chrome, 10 tests passed.
- `pnpm build:pages`: passed.
- `pnpm build:railway`: passed.
- `git diff --check`: passed.

## Transition

The approved design defines `production-cutover-operations` after the current
slice. Transition to `human_gate / next_slice_approval` and wait for explicit
approval before archiving `lesson-one-progress-migration` and beginning that
final slice.

## Exact verdict

APPROVED
