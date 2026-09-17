# Authentication and persistence foundation — `account-profile-ui` Targeted Re-Review

## Review metadata

- **Review date:** 2026-09-16
- **Work item:** `feature-auth-persistence`
- **Work-item type:** `technical_feature`
- **Review scope:** targeted re-review of `MEDIUM-09`
- **Current HEAD SHA:** `8c502ac4c5894d2fbec4496446794e6edd497f2a`
- **Authoritative design:** `docs/technical-designs/feature-auth-persistence.md`
- **Owning review:** `docs/reviews/feature-auth-persistence/implementation-review-07-account-profile-ui.md`
- **Prior targeted re-review:** `docs/reviews/feature-auth-persistence/fix-rereview-08-account-profile-ui.md`
- **Workflow state:** `docs/workflow/feature-auth-persistence.yaml`
- **Slice reviewed:** `account-profile-ui`

## Preflight

The workflow state is consistent and authorizes targeted re-review. It identifies
the work item and type, references the existing approved design and reviews,
uses canonical `phase: fix_rereview` with matching `next.phase`, has no open
gate, marks the current slice as fixed, and lists exactly `MEDIUM-09` as the
active blocking finding. The approved design contains the current slice and the
later `progress-api-sync-core` slice.

## Final verdict

**APPROVED**

The remaining active finding is fixed. The browser regression now exercises
native radio-group keyboard selection and proves that both focus and checked
state move to the next avatar. No direct regression was found.

## Finding verification

### MEDIUM-09 — FIXED

- The focused browser regression places focus on the Cedar radio and verifies
  the corresponding visible label focus treatment.
- It sends `ArrowRight` to the focused radio instead of using a mouse click,
  then asserts that the Ocean radio receives focus and becomes checked.
- The same test continues to verify the fieldset's `aria-describedby` link to
  `avatar-error`, the rendered validation message, and the absence of
  horizontal overflow at 320 px.
- The production avatar controls retain native radio semantics, visible
  `:focus-visible` label styling, text labels, and linked validation feedback.

## Direct regression check

No direct regression was found. The complete unit/service suite, PostgreSQL
integration suite, Chrome browser suite, TypeScript validation, both deployment
builds, and whitespace check pass. The first sandboxed unit/service attempt was
denied loopback binding with `listen EPERM`; the permitted rerun outside that
restriction passed.

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

The approved design defines `progress-api-sync-core` after the current slice.
Transition to `human_gate / next_slice_approval` and wait for explicit approval
before archiving `account-profile-ui` and beginning that slice.

## Exact verdict

APPROVED
