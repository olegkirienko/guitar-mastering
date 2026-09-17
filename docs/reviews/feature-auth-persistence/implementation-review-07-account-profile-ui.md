# Implementation Review 07 — Account and profile UI

## Review metadata

- **Work item:** `feature-auth-persistence`
- **Work-item type:** `technical_feature`
- **Authoritative design:** `docs/technical-designs/feature-auth-persistence.md`
- **Approved amendment:** `railway-node-postgres-architecture-04`
- **Slice reviewed:** `account-profile-ui`
- **Prior review:** `docs/reviews/feature-auth-persistence/fix-rereview-06-auth-session-api.md`
- **Workflow phase reviewed:** `implementation_review`
- **Current HEAD SHA:** `8c502ac4c5894d2fbec4496446794e6edd497f2a`
- **Date:** 2026-09-16
- **Verdict:** `CHANGES REQUIRED`

## Preflight

The workflow state is consistent and authorizes this implementation review. It
identifies the work item and technical-feature type, references the existing
approved design and amendments, uses canonical `phase: implementation_review`
with matching `next.phase`, has no open gate or blocking findings, and marks
`account-profile-ui` as implemented. All referenced artifacts exist. The slice
exists in the approved design, and later approved slices begin with
`progress-api-sync-core`, so this is not the final slice.

## Scope reviewed

The review covered the Railway-only account route and navigation, authentication
provider and restored-session states, registration/login/logout UI, profile API
and form, catalog avatar selection, account-deletion confirmation, Pages-safe
build behavior, accessibility, mobile layout, server and PostgreSQL tests, and
the repository validation gates. No application code was changed during review.

## Assessment

- **Authentication and deployment behavior:** The provider restores the
  same-origin session, distinguishes loading, guest, authenticated, and
  unavailable states, and keeps lesson access usable during API failure. The
  Railway build exposes account navigation and routing. The Pages build omits
  the account route and account/API strings checked in its generated bundle.
- **Profile and deletion behavior:** The endpoint authenticates profile writes,
  trims optional names, rejects unknown fields and non-catalog avatars, and
  returns a no-store response. The UI offers all catalog avatars and a null
  choice. Deletion requires both an explicit irreversible-action confirmation
  and the current password; the server re-verifies that password and relies on
  database cascades.
- **Accessibility and responsive layout:** Authentication and name inputs have
  visible labels, field errors are linked for those text inputs, async status is
  exposed, and the layout remains usable at the approved narrow breakpoint.
  The avatar control still has a blocking keyboard-focus and error-association
  gap described below.
- **Scope discipline and maintainability:** Account state, page UI, HTTP routing,
  domain validation, and persistence remain separated. The slice does not add
  progress synchronization or cutover operations from later slices.
- **Regression posture:** TypeScript, unit/service tests, PostgreSQL integration,
  Pages/Railway builds, and whitespace validation pass. However, the design's
  browser-level regression gate for the behaviors owned by this slice has not
  been implemented.

## Blocking findings

### MEDIUM-08 — Profile subset updates can overwrite a concurrent disjoint edit

`PATCH /profile` accepts a subset of profile fields, but `AuthService.updateProfile`
first reads the whole profile through `session()`, fills every omitted field from
that snapshot, and then writes all three fields. Two tabs or requests that update
different fields can therefore race: each reads the same old row, and the later
write restores its stale value for the field changed by the earlier request.
This violates the subset-PATCH contract and can silently lose valid profile data.

Targeted fix: make each profile update preserve omitted fields atomically at the
database write (for example, by constructing a parameterized update from only
the supplied allowlisted fields or using equivalent single-statement semantics).
Add a PostgreSQL regression that runs or deterministically simulates disjoint
concurrent subset updates and proves both edits survive. Keep the fix confined
to the owned profile endpoint.

### MEDIUM-09 — The avatar radio group lacks visible keyboard focus and a linked error

The catalog radio inputs use `sr-only`, while their labels style only checked
state. Tabbing into or arrowing through the radio group produces no visible
focus indicator, so a keyboard user cannot tell which option has focus. The
avatar validation message also has no identifier or `aria-describedby` link to
the group. This fails the approved requirement for keyboard-operable,
accessible forms with linked errors, despite each radio having a text label.

Targeted fix: expose an obvious `:focus-visible` treatment on the corresponding
avatar label/control, associate the group with its validation message, and add
an accessibility-focused UI regression for keyboard selection, visible focus,
and error association. Preserve the text labels and 320 px layout.

### MEDIUM-10 — Required browser regression coverage is absent

The approved design requires browser tests for account/profile/delete flows,
restored sessions, accessibility/mobile behavior, guest/offline continuity, and
Pages-hidden versus Railway-preview entry points. The repository contains only
build and server-side Vitest files; there is no frontend or browser test for
`AuthProvider`, `AccountPage`, navigation, or the deployment-target route. As a
result, state restoration, form wiring, destructive confirmation, keyboard UX,
responsive rendering, and the end-user distinction between Pages and Railway
are not protected by an executable gate.

Targeted fix: add focused browser-level coverage for the behaviors owned by
`account-profile-ui`: restored authenticated and guest/unavailable states;
register/login/logout; profile and avatar update; confirmed deletion and failure
handling; keyboard/accessibility and 320 px rendering; continued lesson access
during API failure; and Pages-hidden versus Railway-visible account entry
points. Do not implement progress synchronization or production cutover. Reuse
the existing stack where practical; add a test dependency only if the browser
gate genuinely requires it.

## Validation evidence

Executed with Node `v24.7.0` and pnpm `11.9.0`:

- `pnpm lint` — passed.
- `pnpm test` — passed: 9 files passed, 2 PostgreSQL-gated files skipped, 49
  tests passed, and 13 skipped.
- `TEST_DATABASE_URL=postgresql://... pnpm test:postgres` — passed against the
  local PostgreSQL service: 2 files and 13 tests passed.
- `pnpm build:pages` — passed; generated JavaScript did not contain the checked
  account UI or session-API strings.
- `pnpm build:railway` — passed.
- `git diff --check` — passed.

The first sandboxed `pnpm test` attempt could not bind temporary loopback ports
and reported `listen EPERM`; the permitted rerun outside that sandbox
restriction passed with the results above.

## Verdict and transition

**Verdict: `CHANGES REQUIRED`**

Route to `fixes` for exactly `MEDIUM-08`, `MEDIUM-09`, and `MEDIUM-10`. Do not
open the `next_slice_approval` gate or begin `progress-api-sync-core` until all
three findings pass targeted re-review.

## Exact verdict

CHANGES REQUIRED
