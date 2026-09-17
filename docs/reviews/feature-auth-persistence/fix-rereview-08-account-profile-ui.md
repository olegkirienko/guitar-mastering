# Authentication and persistence foundation — `account-profile-ui` Targeted Re-Review

## Review metadata

- **Review date:** 2026-09-16
- **Work item:** `feature-auth-persistence`
- **Work-item type:** `technical_feature`
- **Review scope:** targeted re-review of `MEDIUM-08`, `MEDIUM-09`, and `MEDIUM-10`
- **Current HEAD SHA:** `8c502ac4c5894d2fbec4496446794e6edd497f2a`
- **Authoritative design:** `docs/technical-designs/feature-auth-persistence.md`
- **Owning review:** `docs/reviews/feature-auth-persistence/implementation-review-07-account-profile-ui.md`
- **Workflow state:** `docs/workflow/feature-auth-persistence.yaml`
- **Slice reviewed:** `account-profile-ui`

## Preflight

The workflow state is consistent and authorizes targeted re-review. It identifies
the work item and type, references the existing approved design and owning
review, uses canonical `phase: fix_rereview` with matching `next.phase`, has no
open gate, marks the current slice as fixed, and lists exactly `MEDIUM-08`,
`MEDIUM-09`, and `MEDIUM-10` as active blocking findings. The approved design
contains the current slice and the later `progress-api-sync-core` slice.

## Final verdict

**CHANGES REQUIRED**

`MEDIUM-08` and `MEDIUM-10` are fixed. `MEDIUM-09` is partially fixed because
the implementation now exposes visible focus and links the avatar error, but
the required browser regression does not exercise keyboard selection. Route
only `MEDIUM-09` back to targeted fixes.

## Finding verification

### MEDIUM-08 — FIXED

- `AuthService.updateProfile` constructs its `UPDATE` assignments only from
  present, allowlisted request fields and returns the resulting row from the
  same statement. Omitted profile columns are no longer copied from an earlier
  session snapshot.
- `server/auth.integration.test.ts` issues disjoint `firstName` and `avatarId`
  subset updates concurrently and verifies that both values survive.
- The PostgreSQL integration suite passes with the new concurrency regression.

### MEDIUM-09 — PARTIALLY FIXED

- The avatar labels now use `has-[:focus-visible]` ring and offset styles, so
  focus on each visually hidden native radio has a visible counterpart.
- The fieldset conditionally references `avatar-error` through
  `aria-describedby`, and the rendered validation message owns that identifier.
- The browser test verifies focus styling and error association at 320 px.
- The test moves focus programmatically with `.focus()` and changes the avatar
  by clicking its label. It never sends a keyboard action such as an arrow key
  and therefore does not prove keyboard selection, which the owning finding
  explicitly requires as part of the accessibility-focused UI regression.

Targeted fix: update the focused browser regression to select another avatar
with the keyboard and assert the checked value changes. Keep the fix confined
to the existing account/profile browser test unless the test exposes an actual
control defect.

### MEDIUM-10 — FIXED

- `e2e/account-profile.spec.ts` adds a real Chrome gate for restored
  authenticated and guest states; registration, login, logout, profile and
  avatar submission; confirmed deletion and recoverable failure; API outage
  continuity; 320 px layout; and Railway-visible versus Pages-hidden account
  entry points.
- The gate also verifies visible avatar focus and linked validation feedback.
  Its one keyboard-selection assertion remains owned by `MEDIUM-09`; the
  requested browser infrastructure and broader end-user regression gate are
  present and pass.
- `package.json` and `playwright.config.ts` expose the deterministic
  single-worker Chrome command and launch both deployment-target variants.

## Direct regression check

No direct regression was found. The complete unit/service suite, PostgreSQL
integration suite, Chrome browser suite, TypeScript validation, both deployment
builds, and whitespace check pass. The first PostgreSQL attempt was denied
loopback access by the sandbox with `connect EPERM`; the permitted rerun outside
that restriction passed.

## Validation results

Executed with Node `v24.7.0` and pnpm `11.9.0`:

- `pnpm lint`: passed.
- `pnpm test`: passed, 9 files passed, 2 PostgreSQL-gated files skipped, 49
  tests passed, and 14 skipped.
- `TEST_DATABASE_URL=postgresql://... pnpm test:postgres`: passed against the
  local PostgreSQL service, 2 files and 14 tests passed.
- `pnpm test:browser`: passed in Chrome, 5 tests passed.
- `pnpm build:pages`: passed.
- `pnpm build:railway`: passed.
- `git diff --check`: passed.

## Transition

Transition to `fixes` for exactly `MEDIUM-09`. Do not open the
`next_slice_approval` gate or begin `progress-api-sync-core` until the keyboard
selection regression passes a new targeted re-review.

## Exact verdict

CHANGES REQUIRED
