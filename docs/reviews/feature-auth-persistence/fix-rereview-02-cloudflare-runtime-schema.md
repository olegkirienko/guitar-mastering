# Authentication and persistence foundation — `cloudflare-runtime-schema` Targeted Re-Review

## Review metadata

- **Review date:** 2026-09-11
- **Work item:** `feature-auth-persistence`
- **Work-item type:** `technical_feature`
- **Review scope:** targeted re-review of implementation slice 1
- **Current HEAD SHA:** `fb3454d4c6b56e928b72e326e4aa378b674506f4`
- **Specification:** `docs/technical-designs/feature-auth-persistence.md`
- **Owning review:** `docs/reviews/feature-auth-persistence/implementation-review-01-cloudflare-runtime-schema.md`
- **Workflow state:** `docs/workflow/feature-auth-persistence.yaml`
- **Active finding:** `MEDIUM-03`

## Final verdict

**APPROVED**

The targeted fix closes the automated validation gap without expanding beyond
the `cloudflare-runtime-schema` slice. The repository test command now builds
both deployment targets through the real Vite configuration, evaluates the
actual client capability gate in the compiled output, and applies the checked-in
migration to isolated fresh local D1 state before inspecting its schema.

## Finding verification

### MEDIUM-03 — FIXED

- `build/runtime-schema.acceptance.test.ts` creates independent Pages and Worker
  production builds using `vite.config.ts` and asserts the emitted asset bases.
- The build fixture imports `src/config/deployment.ts`, so the compiled checks
  exercise `accountCapabilitiesEnabled` rather than duplicating its condition in
  the test. Pages must compile the disabled marker and Worker must compile the
  enabled marker; each build also rejects the opposite marker.
- The suite applies `migrations/0001_initial.sql` through Wrangler to a newly
  created temporary persistence directory. It asserts all four strict tables,
  key constraints, the three explicit supporting indexes, and cascade ownership
  foreign keys for profiles, sessions, and lesson progress.
- The checks are included in `pnpm test`, and `pnpm test:runtime-schema` provides
  the documented focused command. Swapping target behavior, enabling the Pages
  client gate, or removing a required table, explicit index, or ownership
  foreign key causes an assertion failure.

No direct regression was found in the build configuration, migration, Worker
tests, or existing frontend build.

## Scope compliance

The fix changes only slice-1 validation infrastructure and documentation. It
does not add credentials, authentication/profile UI, progress synchronization,
or production-cutover behavior.

## Validation results

Executed with Node `v24.3.0`, matching `.nvmrc`:

- `pnpm test`: passed, 3 files and 19 tests.
- `pnpm lint`: passed.
- `pnpm build:pages`: passed.
- `pnpm build:worker`: passed.
- `git diff --check`: passed.

## Next action

The approved design defines the later `auth-session-api` slice. Transition to
`human_gate / next_slice_approval` and wait for explicit approval before
archiving `cloudflare-runtime-schema` and beginning slice 2.

## Exact verdict

APPROVED
