# Authentication and persistence foundation — `cloudflare-runtime-schema` Implementation Review

## Review metadata

- **Review date:** 2026-09-11
- **Work item:** `feature-auth-persistence`
- **Work-item type:** `technical_feature`
- **Review scope:** implementation slice 1, runtime and persistence skeleton
- **Current HEAD SHA:** `fb3454d4c6b56e928b72e326e4aa378b674506f4`
- **Specification:** `docs/technical-designs/feature-auth-persistence.md`
- **Previous review:** `docs/reviews/feature-auth-persistence/design-review-02.md`
- **Workflow state:** `docs/workflow/feature-auth-persistence.yaml`
- **Artifact identifier:** `feature-auth-persistence / implementation-review-01-cloudflare-runtime-schema`

## Final verdict

**CHANGES REQUIRED**

The implementation establishes the intended Cloudflare Worker and D1 skeleton,
keeps the current Pages deployment safe, applies the initial strict schema, and
stays within the first-slice boundary. Manual review validation confirms both
asset bases, the fresh migration, preview bundling, and the health/error router.
One blocking validation gap remains: the committed automated suite does not
exercise the actual build, client capability gate, or local D1 integration
boundary required by the approved slice.

## Findings

### MEDIUM-03 — The automated suite does not enforce the slice's build and D1 acceptance contract

- **Severity:** Medium
- **Classification:** Blocking
- **Files and locations:** `build/deployment-target.test.ts:1-27`;
  `src/config/deployment.ts:1-3`; `vitest.config.ts:3-6`;
  `package.json:9-14`; `migrations/0001_initial.sql:1-59`
- **Issue:** The deployment-target tests call only the pure
  `createDeploymentConfig` and `resolveDeploymentTarget` helpers. They do not
  build either target, inspect the emitted asset base, or exercise the separate
  client-side `accountCapabilitiesEnabled` constant that future account entry
  points must use. The Worker tests call the handler with mocked bindings under
  Node, and no automated test applies `0001_initial.sql` to a fresh local D1
  database or inspects its tables, constraints, indexes, and foreign keys. The
  `db:migrate:local` script is an operator command against reusable local state,
  not an isolated assertion, and none of these integration checks is part of
  `pnpm test`.
- **Why it matters:** The approved design explicitly assigns this slice the test
  harness and automated Pages/Worker base and capability-gate assertions, and
  its integration strategy requires a fresh migration inspection. A Vite wiring
  regression, an always-enabled client capability flag, or invalid migration can
  currently leave all 12 tests green. The reviewer confirmed today's behavior
  manually, but that is not the durable automated contract required before later
  auth/profile slices rely on this foundation.
- **Required fix:** Add focused automated acceptance coverage that exercises the
  real Pages and Worker build wiring, verifies their emitted bases and the actual
  client capability gate, and applies the checked-in migration to isolated fresh
  local D1 state while asserting the required schema invariants. Wire these
  checks into a documented repository validation command. Keep the fix limited
  to slice-1 validation infrastructure; do not add credentials, auth/profile UI,
  progress behavior, or production cutover work.
- **Verification:** Demonstrate that the automated command passes for the current
  implementation and fails when either build target is intentionally swapped,
  the client gate is forced on for Pages, or a required table/index/foreign key
  is removed from the migration.

## What is good and should remain unchanged

- `wrangler.toml` uses a small Worker entry point, SPA fallback, selective
  Worker-first `/api/*` routing, an assets binding, and distinct local/preview D1
  bindings. Wrangler successfully bundles both the default and preview
  environments.
- `worker/index.ts` exposes only health/readiness behavior, delegates non-API
  traffic to static assets, returns JSON for unknown API paths and unsupported
  methods, and does not leak D1 failure details.
- `migrations/0001_initial.sql` creates the four designed strict tables with
  required columns, uniqueness, cascade foreign keys, payload/revision checks,
  and the expected supporting indexes. It applies successfully to fresh local
  D1 state.
- The Vite target resolver fails closed to Pages for missing and invalid values;
  manual builds emitted `/guitar-mastering/` asset URLs for Pages and root asset
  URLs for Worker preview.
- The existing GitHub Pages workflow now selects the Pages target explicitly and
  uses the repository's Node 24 major version.
- Wrangler 4.131.1 and a Paid Workers plan baseline are recorded before the
  authentication slice's required PBKDF2 benchmark.

## Scope compliance

The implementation stays within `cloudflare-runtime-schema`. It does not add
credentials, sessions, auth/profile UI, profile mutation, lesson progress sync,
or production cutover behavior. Existing lesson content and local persistence
remain unchanged.

## Architecture, security, persistence, and compatibility assessment

- **Architecture/runtime:** The explicit route table and assets binding are
  proportionate and match the approved no-framework architecture. Static course
  traffic bypasses the Worker unless it needs the SPA fallback; API traffic runs
  Worker-first.
- **API contract:** Health, readiness, JSON 404, JSON 405, request IDs, and safe
  readiness failures behave consistently. API responses are non-cacheable and
  carry `nosniff`.
- **Persistence:** Required relational ownership and session/progress indexes are
  present. The schema introduces no destructive migration behavior.
- **Security/privacy:** No credentials, cookies, personal fields, request bodies,
  or raw database errors are logged or returned. Placeholder database IDs are
  non-secret and no Cloudflare credential is committed.
- **Compatibility/regressions:** Both deployment targets build successfully;
  Pages retains its subpath base and the existing React course bundle. No lesson
  rendering, navigation, or local-storage code changed.
- **Maintainability:** Runtime responsibilities are small and separated between
  routing and response helpers. `MEDIUM-03` must make the acceptance boundaries
  reproducible before later slices build on them.

## Validation results

The following checks were executed with Node `v24.3.0`, matching `.nvmrc`:

- `pnpm lint`: passed (`tsc -b --pretty false`).
- `pnpm test`: passed, 2 files and 12 tests.
- `pnpm build:pages`: passed; emitted `/guitar-mastering/assets/...` URLs.
- `pnpm build:worker`: passed; emitted `/assets/...` URLs.
- Fresh isolated `wrangler d1 migrations apply DB --local`: passed; all four
  application tables and expected explicit/automatic indexes were present.
- `wrangler deploy --dry-run --env preview`: passed with `DB` and `ASSETS`
  bindings.
- `git diff --check`: passed.

The successful manual build and D1 checks establish current correctness but do
not resolve `MEDIUM-03`, which concerns missing committed automated enforcement.

## Recommended next action

Transition to `fixes` and apply only `MEDIUM-03`, then submit the result for
targeted re-review. Do not begin `auth-session-api` before this slice is approved
and the next-slice human gate is explicitly accepted.

## Exact verdict

CHANGES REQUIRED
