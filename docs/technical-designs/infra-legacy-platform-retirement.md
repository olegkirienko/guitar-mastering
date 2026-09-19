# Legacy deployment-platform retirement

## Status

This is the authoritative infrastructure design for
`infra-legacy-platform-retirement`. It designs cleanup after the approved move
from Cloudflare Workers, D1, and GitHub Pages to Railway Node/Express and
PostgreSQL. It does not authorize implementation or remote deletion.

Policy clarification approved by the owner on 2026-09-19: this learning/pet
project is still selecting its platform. GitHub Pages and Cloudflare were
exploratory, superseded infrastructure, not an established production platform
with a migration rollback obligation. No rollback window or timed drain is
required for their retirement. This clarification does not grant the separate
destructive human approval.

The architecture decision is already recorded in
`docs/technical-designs/feature-auth-persistence.md`. This work item owns only
the retirement of superseded repository and remote deployment artifacts. It
must not change authentication, persistence, course, or other user-facing
behavior except for making Railway the sole deployed application origin after
the approved cutover.

## Goals

- Make Railway the only active application deployment platform.
- Make Railway PostgreSQL the only active persistence platform.
- Keep the Node/Express service responsible for both the Vite SPA and
  `/api/v1`.
- Remove repository paths, build modes, dependencies, generated state, and CI
  jobs whose only purpose is GitHub Pages, Cloudflare Workers, Wrangler, or D1.
- Reconcile active documentation with the Railway topology while preserving
  immutable architecture and review history.
- Retire live GitHub Pages and Cloudflare preview resources only after a
  verified Railway production cutover, an authenticated account-wide
  inventory, exact manifest and remote-identity verification, and explicit
  destructive-cleanup approval.
- Leave durable, non-secret evidence of what was removed, when, by whom, and
  how deletion was verified.

## Non-goals

- New application features, routes, APIs, tables, or changes to auth/session/
  progress behavior.
- Reworking the Railway Node/PostgreSQL architecture selected by the approved
  authentication and persistence design.
- Migrating experimental D1 data into PostgreSQL. The approved architecture
  states that D1 contains no live accounts and is disposable, but remote cleanup
  must verify that assumption again before deletion.
- Rewriting immutable review artifacts or completed workflow history to hide
  the superseded Cloudflare implementation.
- Deleting unrelated Cloudflare account resources.
- Deleting any live remote resource during design or design review.
- Treating approval of this design as approval to delete live resources.

## Inventory method and evidence date

Inventory was performed on 2026-09-16 against:

- the current working tree, including uncommitted Railway migration work;
- tracked `HEAD` (`8c502ac`) to identify artifacts already deleted or replaced
  in the working tree;
- Git history for deployment-workflow provenance;
- public probes of the known GitHub Pages and Workers preview origins;
- Railway CLI status for the linked project;
- Wrangler 4.131.1 command help and unauthenticated account status.

The working tree already contains substantial uncommitted migration changes.
Those changes belong to `feature-auth-persistence` and must not be overwritten,
reverted, or silently claimed by this work item. Implementation must re-run the
inventory against its starting commit because some entries below may have been
committed or removed by the owning work item first.

### Cross-work-item ownership

The open `feature-auth-persistence` design currently assigns obsolete
Worker/D1 repository cleanup to `railway-node-postgres-foundation` and Pages
shutdown to `production-cutover-operations`. This work item must not race or
duplicate those slices. Before implementation, one of these handoffs must be
true and recorded in both workflow histories:

- the parent slice completed the overlapping change, in which case this work
  item verifies and records it instead of reimplementing it; or
- an approved amendment to the parent design delegates the remaining cleanup
  to this work item.

The parent work item retains ownership until that handoff exists. This design
does not silently amend another workflow.

## Repository inventory and disposition

### GitHub Pages deployment and build configuration

| Artifact | Observed state | Disposition | Reason / preserved evidence |
|---|---|---|---|
| `.github/workflows/deploy.yml` | Tracked; deploys `main` to GitHub Pages using `build:pages`, `configure-pages`, `upload-pages-artifact`, and `deploy-pages` | Remove in repository cleanup | It is an active application deployment path and conflicts with Railway-only deployment. Git history preserves it. |
| `.github/workflows/ci.yml` | New migration validation workflow; still has a “Build GitHub Pages” step | Replace the Pages build with one Railway production-artifact build | Validation must exercise the one supported deployable artifact, not keep a second deployment target alive. |
| `package.json` `build:pages` | Present in migration working tree | Remove | Railway becomes the only production build target. |
| `build/deployment-target.ts` | Still models `pages | railway`, defaults invalid/missing values to Pages, and varies Vite base/capabilities | Remove the multi-target abstraction; Vite uses root base and the deployed frontend uses the already-approved Railway capability behavior | A Pages-safe fallback is no longer a supported application runtime. |
| `build/deployment-target.test.ts` | Still asserts Pages fallback/base/capability gating | Remove with the obsolete abstraction; cover root/static/API invariants in foundation/server acceptance instead | The old assertions encode an obsolete active platform. |
| `build/foundation.acceptance.test.ts` | Builds both Pages and Railway and asserts Pages hides account capability | Convert to one Railway artifact and assert root assets, frontend/API serving contract, and capability state | Avoid retaining Pages as a hidden release mode. |
| `test-fixtures/deployment-gate/main.ts`, `src/config/deployment.ts`, `src/vite-env.d.ts`, `vite.config.ts` | Still carry deployment-target switching | Remove obsolete switching while retaining root-base and same-origin API behavior | These are active code/config, not historical evidence. |
| `README.md` | Describes GitHub Pages as active, documents `build:pages`, and says Pages is the fail-closed default | Update to Railway-only commands/topology | Active operator documentation must match reality. |
| `AGENTS.md` tech stack | Lists GitHub Pages | Replace with Railway Node/Express and PostgreSQL | Project-wide instructions must not direct future work toward the retired platform. |
| GitHub Pages repository setting and `github-pages` environment | The public URL `https://olegkirienko.github.io/guitar-mastering/` returned HTTP 200 on 2026-09-16; unauthenticated REST could not enumerate private repository settings | Disable/delete only in the remote-retirement slice | A live site is a remote destructive operation. Record final URL/settings/environment inventory with authenticated GitHub access first. |

Removing the deploy workflow is not sufficient to achieve the target state:
the already-published Pages site may remain reachable. The remote-retirement
slice must explicitly disable Pages after the dedicated destructive approval
and verify the URL no longer serves the application.

### Cloudflare Worker, Wrangler, D1, and generated artifacts

| Artifact | Observed state | Disposition | Reason / preserved evidence |
|---|---|---|---|
| `worker/index.ts`, `worker/http.ts`, `worker/index.test.ts` | Tracked in `HEAD`; deleted by current migration work | Remove from the eventual Railway commit; do not recreate | Worker routing/runtime is superseded. Git history and immutable reviews retain the evidence. |
| `wrangler.toml` | Tracked in `HEAD`; deleted by current migration work | Remove | Declares the Worker entry point, static asset binding, preview environment, and D1 binding. The retirement record captures resource identity before deletion. |
| `migrations/0001_initial.sql` | Tracked D1/SQLite migration; deleted by current migration work | Remove from active tree | It is not a PostgreSQL input. Git history and Cloudflare implementation reviews preserve it. |
| `build/runtime-schema.acceptance.test.ts` | Tracked Worker/D1 build and local migration acceptance; deleted by current migration work | Remove | It validates a runtime that must no longer be deployable. PostgreSQL/Node acceptance replaces it. |
| `tsconfig.worker.json` | Tracked; deleted by current migration work | Remove | Worker-only TypeScript project and generated type surface are obsolete. |
| `@cloudflare/workers-types` | Present in `HEAD`; removed from migration `package.json`/lockfile | Remove | Worker binding types are no longer used. No checked-in `worker-configuration.d.ts` was found. |
| `wrangler` | Present in `HEAD`; removed from migration `package.json`/lockfile | Remove | Application development and CI must not depend on Wrangler. Use an ephemeral, explicitly pinned CLI only in the one-time retirement runbook. |
| `build:worker`, `test:runtime-schema`, `db:migrate:local` | Present in `HEAD`; removed by migration | Remove | Worker/D1 build, test, and migration entry points are obsolete. |
| `pnpm-workspace.yaml` `workerd` allow-build and Cloudflare release-age exclusions | Present in `HEAD`; removed by migration | Remove | They exist only for Wrangler/Miniflare/workerd. |
| `tsconfig.json`, `vitest.config.ts`, `src/vite-env.d.ts`, deployment target fixtures | Already being redirected from Worker to server/Railway | Keep the Railway form; verify no Worker references remain | These files remain active but must contain only the replacement runtime. |
| `.wrangler/` | Ignored local Miniflare cache, D1 SQLite, KV, R2, cache, and observability files exist on this workstation | Delete local generated state after no process uses it; never archive it | Generated local state is not source or evidence. Before removing `.gitignore` coverage, verify the directory is absent. |
| `.gitignore` entry `.wrangler/` | Present | Retain as a defensive ignore | The one-time retirement runbook may invoke an ephemeral Wrangler CLI, and historical checkouts may regenerate local caches. Ignoring them prevents accidental commits and has no runtime effect. |
| `pg-cloudflare` in `pnpm-lock.yaml` | Present as a transitive dependency of `pg` | Keep | Despite its name, it is shipped by the PostgreSQL client package and is not evidence of a Worker/D1 runtime dependency. Do not force-remove a valid transitive package. |

### Cloudflare variables and secrets

No `CLOUDFLARE_*`, `CF_*`, Worker secret values, `.dev.vars`, or generated
Worker binding declarations are present in the active working tree. Historical
workflow notes mention `CLOUDFLARE_API_TOKEN` as an operator/deployment
credential, but it is not currently exported in this environment. Wrangler is
not authenticated, so Worker secret metadata and account token inventory could
not be enumerated during design.

The remote-retirement preflight must list names only, never values, across:

- Worker secrets for every resolved legacy Worker/environment;
- GitHub Actions repository/environment secrets and variables that are
  Cloudflare-only;
- Cloudflare API tokens used for this repository, including any manually held
  deployment token;
- routes, custom domains, service bindings, tail consumers, triggers, and other
  resources that depend on the Worker;
- D1 bindings and database names/IDs.

Cloudflare-only secrets/tokens are revoked after the dependent resources are
deleted and verification is complete. Shared account tokens are narrowed or
left untouched unless their ownership and other consumers are proven.

### Documentation classification

| Documentation | Disposition |
|---|---|
| `README.md`, `AGENTS.md`, active CI comments/runbooks | Update to Railway as the sole active platform and remove operational Pages/Workers/D1 instructions. |
| `docs/technical-designs/feature-auth-persistence.md` | Retain as the active architecture history while its work item remains open. Do not erase comparison rationale or historical slices. Any current-state wording changed by its owning work item must distinguish history from active operations. |
| `docs/workflow/feature-auth-persistence.yaml` | Retain unchanged as workflow/audit history except through its own orchestrated transitions. Cloudflare notes and completed slices are intentionally historical. |
| `docs/reviews/feature-auth-persistence/*` | Retain unchanged. Reviews are immutable snapshots and are the principal evidence for why Workers/D1 were rejected. |
| Git history for deleted code/config/migrations | Retain. Do not copy obsolete runtime code into a new archive directory. |
| This design, workflow, review, and final retirement record | Retain as the durable cleanup decision and evidence. The final record contains metadata, counts, IDs, timestamps, and verification results but no secrets or exported user data. |

## Live platform inventory

### Railway replacement state

The linked Railway project is `guitar-mastering`
(`112644ba-cb91-443b-ae4b-73a0d6f74b69`). On 2026-09-16:

- preview environment `29dd5f5e-13c9-4361-8d81-b174de654f92` exists;
- web service `guitar-mastering-web`
  (`556ad969-4dd4-4560-8ef0-0c09f4684d4a`) has a successful running
  deployment and service domain
  `guitar-mastering-web-preview.up.railway.app`;
- PostgreSQL service `Postgres`
  (`7dc92c14-74bf-4a36-a82c-5edb70a5f28d`) has a successful running
  deployment and a ready persistent volume;
- production environment `994fd373-dd1d-4073-8b7f-116e77d898fa` exists but
  has no service instances.

Therefore preview proves replacement feasibility, but production cutover has
not happened. No legacy live origin may be destroyed until the production
preconditions below pass, unless the owner explicitly changes the product to a
preview-only deployment in a reviewed amendment.

### Known Cloudflare preview resources

Committed configuration identifies:

- Worker service/environment: `guitar-mastering-preview`, exposed at
  `https://guitar-mastering-preview.oleg-v-kirienko.workers.dev`;
- D1 database: `guitar-mastering-preview`;
- D1 database ID: `c70af9e6-73e0-4baa-8023-af8679cba410`;
- Worker bindings: `ASSETS` and `DB`;
- `workers.dev` enabled; preview URLs disabled in the last committed config.

Public probes on 2026-09-16 returned HTTP 200 from both `/api/v1/health` and
`/api/v1/readiness`; the latter returned `status: ready`. This proves the Worker
and a functioning persistence binding are still active. It does not prove the
absence of other Workers, versions, routes, domains, secrets, or D1 databases.

Wrangler reported that the current environment is unauthenticated. The known
resources above are sufficient to establish that cleanup is required, but not
to authorize deletion. The destructive slice must begin with an authenticated,
account-wide enumeration and reconcile every result against the repository
identity. Unknown or shared dependencies fail closed.

### Known GitHub Pages resource

`https://olegkirienko.github.io/guitar-mastering/` returned HTTP 200 on
2026-09-16. The tracked deployment workflow writes this site on every `main`
push. Authenticated repository settings, custom-domain state, deployment
environment protections, and retained artifacts were unavailable during
design and must be captured before disabling the site.

## Required target topology and invariants

```text
browser ── HTTPS ──> Railway Node/Express service
                       ├─ /api/v1/* ──> Express API
                       ├─ /assets/* ──> Vite dist assets
                       ├─ SPA fallback ──> dist/index.html
                       └─ private DATABASE_URL ──> Railway PostgreSQL
```

- One public application origin serves frontend and API.
- Railway deploy configuration is the only application deployment
  configuration in the active tree.
- CI validates but does not deploy to GitHub Pages or Cloudflare.
- No active source imports Worker types or expects D1/asset bindings.
- No active migration or test invokes Wrangler, Miniflare, D1, or workerd.
- PostgreSQL migrations remain owned by `server/migrations` and run through the
  Railway pre-deploy command.
- Historical documents may say Cloudflare or Pages only in explicitly
  historical context.
- GitHub Pages, Workers, D1, their repository secrets, and dedicated tokens are
  absent after the final verified remote-retirement slice.

## Preconditions and fail-closed rules

Repository cleanup implementation may begin only after explicit
`design_approval`, the cross-work-item ownership handoff above, and a healthy
Railway production deployment. Before it changes deployment paths, it must
also verify that its changes do not collide with uncommitted work owned by
`feature-auth-persistence`.

Remote retirement has a stricter gate. It may proceed immediately, without a
rollback window or timed drain, once all four checks below pass:

1. **Exact manifest verification:** the manifest SHA-256 and reviewed
   repository-state identity match the current payload, and the reviewed
   cleanup is present on the GitHub default branch with no legacy deployment
   workflow.
2. **Remote identity verification:** authenticated GitHub and Cloudflare
   inventories match every exact resource and dependency named in the
   manifest. D1 application-table row counts remain zero; any new user data or
   unreviewed dependency stops retirement. Design Amendment 01 removes the
   external D1 export prerequisite.
3. **Railway health verification:** the approved ownership handoff and parent
   authentication/persistence acceptance remain established; Railway
   production web and PostgreSQL are successful, the canonical domain,
   `/api/v1/health`, `/api/v1/readiness`, and root SPA are healthy, the
   documented backup/restore proof exists, and Railway has no dependency on
   the legacy resources.
4. **Explicit human approval:** the workflow is at `next_slice_approval` with
   action `authorize-destructive-live-legacy-resource-retirement`, and the
   owner explicitly approves the exact Worker, D1 database, Pages site,
   secrets, and tokens in the reviewed manifest. The approval identifies the
   repository state (commit when available, otherwise base commit plus exact
   diff) and SHA-256 digest of
   `docs/operations/legacy-platform-retirement-manifest.md`.

Design approval, approval of the first implementation slice, or approval of the
Railway architecture does not satisfy item 4. If any check fails, stop;
do not partially delete remote resources.

## Safe live-resource deletion plan

### Phase A — authenticated discovery and archival evidence

1. Use an authenticated Cloudflare identity with least privilege. Record the
   account ID and operator identity, not credentials.
2. List Workers/services, versions/deployments, routes/custom domains,
   `workers.dev` state, triggers, tail consumers, bindings/dependencies, and
   Worker secret names. Resolve the exact preview Worker by name and URL.
3. List all D1 databases and resolve
   `c70af9e6-73e0-4baa-8023-af8679cba410`; query schema, migration state, table
   names, and aggregate row counts without exporting credentials or personal
   values to logs.
4. List Cloudflare Pages projects to prove that this repository did not also
   create a Cloudflare Pages deployment. If a matching project exists, add it
   to the approval inventory rather than deleting it by inference.
5. With authenticated GitHub access, capture Pages build type, source,
   environment, custom domain, workflow runs, relevant secrets/variables by
   name, and the current public URL.
6. Compare Cloudflare account tokens and GitHub secrets to known consumers.
   Dedicated legacy credentials become deletion candidates; shared credentials
   remain until every consumer is resolved.

### Phase B — explicit destructive approval

Present one immutable approval manifest containing:

- Cloudflare account ID;
- Worker name, URL, routes/domains, latest deployment/version identity, and
  secret names;
- D1 name, UUID, schema/migration identity, and application-table counts;
- GitHub Pages URL, build source, environment/custom domain, and relevant
  secret/variable names;
- dependency check results;
- Railway production deployment/database/domain identities and health evidence;
- exact deletion order, verification checks, and rollback limitations.

The non-destructive first implementation slice writes the manifest to
`docs/operations/legacy-platform-retirement-manifest.md`. Its implementation
review freezes the file, records its repository-state identifier and SHA-256
digest in workflow state, and then opens `next_slice_approval`. Any content or
resource identity change closes the gate and requires a new implementation
review and manifest digest.

The owner must approve that manifest at the dedicated workflow gate. Any
resource identity change invalidates approval and requires a fresh manifest and
approval.

### Phase C — verify and delete

1. Freeze legacy deploys first: merge the reviewed repository cleanup so no
   workflow or normal script can recreate Pages or Worker deployments.
2. Immediately before any mutation, repeat checks 1–3 above and confirm that
   check 4's explicit approval of this exact manifest was recorded before the
   workflow entered implementation. No rollback window, timed drain, or
   legacy-origin traffic-wait condition is required. Capture available request
   metrics as context, not as a waiting gate.
3. Disable the GitHub Pages site using the authenticated repository setting.
   Do not delete the repository, environment history, or workflow history.
4. Delete `guitar-mastering-preview` Worker by exact resolved name. Use
   Wrangler's dry-run/dependency protection first; do not use force if a
   dependency is reported. Verify the workers.dev URL and any routes/domains no
   longer serve the application.
5. Re-list D1 bindings/dependencies. Only after the Worker is gone, delete D1
   database `guitar-mastering-preview` with UUID
   `c70af9e6-73e0-4baa-8023-af8679cba410`. Preserve the confirmation output in
   the retirement record without data rows.
6. Delete dedicated Worker secret metadata with the Worker, then revoke
   dedicated Cloudflare API tokens and remove Cloudflare-only GitHub secrets/
   variables. Do not revoke shared credentials without separate authorization.
7. Remove orphan routes/custom domains/triggers only when the inventory proves
   they belong solely to this Worker. Do not touch unrelated zones/resources.

### Phase D — verification

- Authenticated lists no longer contain the approved Worker or D1 UUID.
- The Workers preview and GitHub Pages URLs no longer serve the application;
  expected provider-level 404/disabled results are recorded.
- No GitHub Actions job deploys the application to Pages or Cloudflare.
- Repository search and a fresh lockfile install show no direct Wrangler,
  workerd, Miniflare, D1, or Workers-types dependency.
- Railway production frontend, API health/readiness, authentication smoke, and
  persistence smoke still pass after legacy shutdown.

Remote rollback after Worker/D1 deletion is not an ordinary redeploy: it may
require recreating resources with new identities. The historical Pages fallback
tag remains evidence, not a required rollback window or active production
fallback. There is no retained D1 export under Design Amendment 01; supported
production recovery is Railway deployment rollback and PostgreSQL PITR. These
limitations must be visible in the manifest approved immediately before
deletion.

## Secrets, privacy, and security

- Never commit API tokens, database exports, Pages credentials, secret values,
  user rows, or raw request logs.
- Inventory secret names and ownership only.
- Use least-privilege short-lived credentials for discovery/deletion where
  possible. Revoke dedicated credentials only after verification.
- A nonzero user/session/profile/progress count is a blocking discovery. Stop
  for a migration/data-retention decision; do not rely on the old design's
  assumption.
- Preserve immutable review and workflow records because they explain security
  decisions without preserving live credentials or data.

## Failure modes and recovery

| Failure | Response |
|---|---|
| Railway production absent/unhealthy | Do not remove deploy workflow or remote legacy origins; finish/fix production cutover first. |
| Repository cleanup collides with uncommitted migration work | Stop and coordinate ownership; never restore or discard the other work item. |
| Authenticated inventory finds extra Worker/D1/Page resource | Add it to a reviewed manifest; do not infer ownership or delete it. |
| D1 contains unexpected durable data | Stop; encrypt/export; open a separate migration/retention decision. |
| Worker reports a dependent service/route | Do not use force; resolve the dependency and repeat review/approval. |
| An unreviewed caller or dependency on a legacy origin is discovered | Stop, resolve ownership and impact, then refresh the manifest and approval; no timed drain is implied. |
| Remote deletion partially succeeds | Stop further deletion, record exact state, keep Railway canonical, and choose provider-specific recovery before proceeding. |
| Dedicated token cannot be proven dedicated | Leave it active but flag it for credential ownership review; do not break unrelated services. |
| Legacy URL still serves after reported deletion | Inspect route, cache, alternate account/project, and DNS state before declaring completion. |

## Validation strategy

Repository slice validation:

- `pnpm lint`;
- `pnpm test`;
- `pnpm test:postgres` with the repository test database;
- `pnpm build:railway` or its Railway-only replacement;
- `git diff --check`;
- searches of tracked active files for Pages deploy actions, `build:pages`,
  `build:worker`, Wrangler, D1 bindings/migrations, Worker types, `worker/`, and
  Cloudflare credential names;
- negative CI inspection proving no deployment job targets Pages/Cloudflare;
- positive server tests proving Express still serves SPA assets/fallback and
  `/api/v1` separately.

Remote slice validation uses authenticated read-back, provider URLs, Railway
health and smoke tests, and the final non-secret retirement record. Exit code
zero from a delete command is not sufficient.

## Implementation slices

### 1. `repository-cleanup-and-retirement-preflight`

Owns repository-local cleanup and non-destructive remote preflight:

- remove the GitHub Pages deploy workflow and Pages build from CI;
- remove the Pages deployment target, script, fixture branches, tests, and
  active documentation; remove the multi-target build/config abstraction and
  keep Railway root-base/account capability behavior as the single path;
- reconcile all pending Worker/D1/Wrangler deletions from the migration work
  without reverting or duplicating that work;
- remove direct Cloudflare-only dependencies/configuration/generated local
  state while retaining the defensive `.wrangler/` ignore entry;
- preserve immutable reviews/workflows and Git history;
- capture the last-known-good Pages tag/artifact and tested restoration steps;
- perform authenticated, read-only GitHub/Cloudflare discovery and verify D1
  schema, migration, table counts, and dependencies;
- write `docs/operations/legacy-platform-retirement-manifest.md` with exact
  resource identities, non-secret evidence, deletion order, Railway evidence,
  and recovery limitations;
- add `docs/operations/legacy-platform-retirement-record.md` as an uncompleted
  record template containing no remote deletion claim;
- prove the Node/Express Railway artifact still serves frontend and API.

This slice performs no destructive remote mutations. Read-only inventory is
allowed, but Pages/Worker/D1/secret/token deletion, disablement,
or revocation is forbidden. It cannot claim the target topology is fully
complete while Pages/Cloudflare URLs remain live. Its implementation review
must record the manifest repository-state identifier and SHA-256 digest before
opening the next human gate. If no commit exists yet, it records the base
commit plus exact diff identity instead.

### 2. `live-legacy-resource-retirement` — final, destructive

Owns a final read-only identity/digest/health freshness check, GitHub Pages
disablement, exact Worker/D1 deletion, dedicated credential revocation,
read-back verification, Railway post-cleanup smoke tests, and completion of the
final retirement record.

This slice may begin only after the approved first slice reaches
`next_slice_approval`, all remote preconditions pass, and the owner explicitly
approves its `authorize-destructive-live-legacy-resource-retirement` action
with the immutable manifest. No implementation agent may interpret the general
design gate as that approval.

There is no later implementation slice. After its implementation review is
approved, the workflow must use `work_item_completion`.

## Definition of done

- Railway production is the only live application deployment and Railway
  PostgreSQL is the only live persistence service.
- One Node/Express service serves the Vite frontend and `/api/v1` at the
  canonical origin.
- No CI job deploys the application to GitHub Pages or Cloudflare.
- No active application code, configuration, tests, scripts, types, or direct
  dependencies require Workers, Wrangler, Miniflare/workerd, or D1.
- GitHub Pages, the exact approved Worker, D1 database, and dedicated legacy
  credentials are absent, with authenticated verification evidence.
- Active documentation describes Railway only; historical designs, workflow
  records, reviews, and Git history remain intact and clearly historical.
- Both implementation slices pass review and their required human gates.
