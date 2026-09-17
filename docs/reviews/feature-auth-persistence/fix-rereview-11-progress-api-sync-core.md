# Targeted Re-Review 11 — Progress API and sync core

## Review metadata

- **Work item:** `feature-auth-persistence`
- **Work-item type:** `technical_feature`
- **Authoritative design:** `docs/technical-designs/feature-auth-persistence.md`
- **Owning review:** `docs/reviews/feature-auth-persistence/implementation-review-10-progress-api-sync-core.md`
- **Workflow state:** `docs/workflow/feature-auth-persistence.yaml`
- **Slice reviewed:** `progress-api-sync-core`
- **Active finding reviewed:** `MEDIUM-11`
- **Current HEAD SHA:** `8c502ac4c5894d2fbec4496446794e6edd497f2a`
- **Date:** 2026-09-16

## Preflight

The workflow state is consistent and authorizes targeted re-review. It
identifies the work item and technical-feature type, references the existing
approved design and owning review, uses canonical `phase: fix_rereview` with
matching `next.phase`, has no open gate, marks `progress-api-sync-core` as
fixed, and lists exactly `MEDIUM-11` as the active blocking finding. The
approved design contains the current slice and the later
`lesson-one-progress-migration` slice.

## Final verdict

**APPROVED**

The active finding is fixed. The PostgreSQL acceptance suite now covers the
required progress size and catalog boundaries and proves rejected writes leave
durable progress unchanged. No direct regression was found.

## Finding verification

### MEDIUM-11 — FIXED

- The PostgreSQL integration gate rejects an unknown lesson and unsupported
  schema and content versions.
- It rejects an unknown current step, an out-of-catalog completed step,
  duplicate completed steps, and an invalid completion timestamp.
- After all rejected service writes, it verifies the original progress item is
  unchanged and exactly one progress row remains.
- A direct oversized JSONB update proves PostgreSQL raises check-violation code
  `23514` for the named `lesson_progress_size` constraint and preserves the
  original valid item and revision.
- The fix is confined to the requested acceptance coverage; no production or
  future-slice code was changed.

## Direct regression check

No direct regression was found. The complete unit/service suite, PostgreSQL
integration suite, Chrome browser suite, TypeScript validation, both deployment
builds, and whitespace check pass.

## Validation results

Executed with Node `v24.7.0` and pnpm `11.9.0`:

- `pnpm lint`: passed.
- `pnpm test`: passed, 12 files passed, 3 PostgreSQL-gated files skipped, 56
  tests passed, and 19 skipped.
- `TEST_DATABASE_URL=postgresql://... pnpm test:postgres`: passed against the
  local PostgreSQL service, 3 files and 19 tests passed.
- `pnpm test:browser`: passed in Chrome, 5 tests passed.
- `pnpm build:pages`: passed.
- `pnpm build:railway`: passed.
- `git diff --check`: passed.

## Transition

The approved design defines `lesson-one-progress-migration` after the current
slice. Transition to `human_gate / next_slice_approval` and wait for explicit
approval before archiving `progress-api-sync-core` and beginning that slice.

## Exact verdict

APPROVED
