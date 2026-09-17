# Authentication and persistence foundation

## Status and amendment history

This is the authoritative technical design for `feature-auth-persistence`. It is
a design artifact, not implementation authorization.

Architecture Design Amendment 04, dated 2026-09-15, selects a Railway-hosted
Node.js backend plus PostgreSQL. It supersedes every earlier Cloudflare
Workers/D1 runtime, KDF, deployment, migration, rate-limit, test, and slice
assumption. Product behavior and security invariants remain unless explicitly
changed here. Amendments 01–03 and Design Reviews 03–06 remain immutable
historical evidence; they are no longer implementation instructions.

The React/Vite SPA is currently deployed to GitHub Pages. Lesson 1 has a
validated local snapshot in `src/pages/LessonOnePage.tsx`. The target keeps the
course usable without an account while adding same-origin APIs and durable
cross-device progress.

## Goals

- Support unique-username/password registration and login.
- Keep revocable server sessions inaccessible to JavaScript.
- Persist optional profile names, an application avatar, and lesson progress.
- Preserve safe guest-to-account progress reconciliation and local-first use.
- Put API execution, relational persistence, environments, secrets, deployment,
  and basic operations in one coherent Railway project.
- Use a conventional backend that supports transferable Node/PostgreSQL skills
  and avoids Worker-isolate password-hashing constraints.

## Non-goals

- Social login, passkeys, MFA, roles, administration, subscriptions, or public
  profiles.
- Email/phone, password reset, or username change. Registration must disclose
  that automated recovery is unavailable.
- User-uploaded avatars, object storage, analytics, scores, or certification.
- Persisting transient interaction, animation/audio state, or private reflection.
- A lesson-engine/content redesign.
- Redis, microservices, Kubernetes, HA, multi-region writes, or read replicas.
- Migrating disposable experimental D1 auth data; there are no live accounts.

## Architecture Design Amendment 04

### Decision and topology

Adopt Railway-hosted Node.js plus PostgreSQL.

One persistent Node web service serves the Vite `dist/` output and handles
`/api/v1/*`. One PostgreSQL service in the same Railway project/environment is
reachable only over private networking. Preview and production use separate
Railway environments and databases. This preserves same-origin cookies and
simple CSRF controls without the isolate runtime.

```text
browser ── HTTPS ──> Railway Node web service
                       ├─ /assets/* and SPA fallback ──> dist/
                       ├─ /api/v1/* ──> Express modules
                       └─ private DATABASE_URL ──> Railway PostgreSQL
```

Use Node 24 pinned to `>=24.7 <25`, Express 5, `pg`, and
`node-pg-migrate`. Express and explicit SQL/transactions are intentionally
conventional and visible for learning. No ORM, Redis, or auth framework is
introduced. The service listens on Railway's `PORT`, drains on `SIGTERM`, closes
its pool, serves hashed assets with immutable caching, revalidates `index.html`,
and returns JSON for all unknown API paths/methods.

Keep `HashRouter`. Pages builds retain `/guitar-mastering/`; Railway builds use
`/`. Until final cutover, GitHub Pages stays canonical and compiles account,
profile, and sync entry points out; Railway preview exposes them.

### Comparison

| Concern | Cloudflare Worker + D1 | Railway + Node + PostgreSQL | Result |
|---|---|---|---|
| Authentication | Compact edge router, but auth became coupled to isolate behavior. | Normal Node lifecycle, Express middleware, and PostgreSQL transactions. | Railway is clearer and more conventional. |
| Password hashing | Three local policies required redesign; deployed proofs hit KDF ceilings/resource failures; selected Workers API lacked Argon2. | Node 24 supplies asynchronous native Argon2id; container CPU/RAM and concurrency are explicit. | Railway removes the decisive blocker. |
| Sessions | Opaque cookies work, with D1-specific batch semantics. | Same design maps to SQL transactions, row locks, and constraints. | Behavior is preserved with familiar primitives. |
| Data/migrations | SQLite semantics, Wrangler migrations, automatic D1 Time Travel. | UUID, `timestamptz`, `jsonb`, richer SQL/tooling; Railway PostgreSQL recovery is operator-owned through PITR, with logical dumps used only as a verified on-demand portability mechanism under the accepted pet-project policy. | Better data foundation; more backup ownership and explicitly lower recovery redundancy. |
| Local development | Wrangler/local D1 did not reveal deployed KDF behavior. | Same Node line and PostgreSQL major version locally; Vite proxies to the API. | Less runtime drift. |
| Deployment | Very low-ops edge runtime, integrated assets/bindings, global scale. | One Railway project with web/database services, Git deploys, health checks, pre-deploy migrations, environments, and private networking. | Still coherent, but regional/container-based. |
| Variables/secrets | Wrangler bindings plus Cloudflare/GitHub secret surfaces. | Railway variables/reference variables become ordinary process environment. | One backend configuration model. |
| Observability | Invocation analytics, logs, D1 metadata. | stdout/stderr plus CPU/RAM/disk/network; application metrics require structured logs or later telemetry. | Better process visibility; app telemetry remains our job. |
| Rate limiting | Convenient native limiter, but permissive and location-local. | Atomic PostgreSQL counters work across restarts/replicas; edge controls can be added later. | Slightly more code/writes, deterministic without Redis. |
| Operations | Fewer services, but exceptional KDF/runtime engineering dominated. | Two services, pools, backups, lifecycle, and regional capacity. | More visible infrastructure, less exceptional code. |
| Cost | Workers Paid starts at USD 5/month with large included usage; assets/D1 scale cheaply. | Hobby starts at USD 5/month as usage credit, then CPU/RAM/storage/egress. Persistent web + database will generally cost more. | Accept a likely modest increase; measure and cap it. |
| Extensibility | Excellent edge ecosystem; heavy native/server workloads may need redesign. | Standard libraries, jobs, WebSockets, email, file work, and PostgreSQL extensions fit the same runtime. | Railway better matches likely growth. |
| Learning value | Edge/serverless bindings and constraints. | HTTP lifecycle, middleware, SQL, pooling, transactions, migrations, secrets, deployment, logs, backups, and capacity. | Railway matches the owner's goal. |

Cloudflare remains stronger for price, global static delivery, scale-to-zero,
and automatic D1 Time Travel. Those benefits do not outweigh the observed KDF
uncertainty and the desired conventional learning environment. Railway is the
new target; another Workers-local KDF attempt is not approved.

### Cost and availability boundaries

- Production uses a paid Railway plan. Free credits and sleeping/serverless mode
  are experimental only: wake-up can add latency or an initial 502, and database
  traffic can prevent sleep.
- Configure usage notifications/limits and measure one week of preview usage
  before final CPU/RAM selection. Pricing is rechecked at cutover.
- Start with one web replica in one region. Correctness, sessions, and rate
  limits must remain replica-safe for later scaling.
- PostgreSQL stays private. Production must not enable its public TCP proxy;
  administration uses an authenticated tunnel/runbook.

## Design Amendment 05 — Production backup policy

### Decision and scope

Native Railway volume backups are unavailable on Trial and Hobby entitlements
and require Railway Pro. The authenticated workspace administrator can list
backups and schedules, and Railway exposes manual-create plus daily, weekly, and
monthly schedule APIs, but the effective plan limit permits zero native volume
backups. This is a platform-plan constraint, not a missing permission or API.

For this learning/pet project, the owner explicitly accepts Railway PITR as the
only continuously maintained recovery copy. Logical dumps are a verified
on-demand export and portability mechanism, not a retained or current second
backup layer. The following are mandatory for cutover:

1. Railway PostgreSQL PITR is enabled and healthy;
2. a PITR restore drill has completed successfully into an isolated target;
3. a provider-independent logical dump can be created;
4. that logical dump has restored successfully into an isolated target; and
5. production database readiness and health verification pass after the drills.

Railway native scheduled or manual volume backups are not mandatory for this
project's production cutover. They remain a recommended future enhancement if
the project moves to Railway Pro or becomes production-critical.

### Accepted tradeoff and recovery boundary

Without the native volume-backup layer, the project has no Railway-managed
scheduled snapshot history or native volume-restore path in addition to PITR.
Recovery therefore depends on PITR for incidents inside its usable archive
window. The completed logical-dump drill proves that an operator can export and
reconstruct the database, but its temporary dump was deleted and supplies no
recoverable copy. No scheduled or retained logical dump, off-project copy, or
recovery point outside PITR is promised. If PITR and its Railway project/bucket
are unavailable or deleted before a fresh export is made, current server data
may be unrecoverable. The owner explicitly accepts that single-copy,
shared-control-plane risk because this is a learning/pet project, not a
production-critical service.

PITR coverage starts only after its first successful base backup, is limited to
the available archive window, depends on a healthy asynchronous archiver and its
Railway bucket, and may be shorter after archive interruption. PITR restoration
creates a separate service that must be verified before any reviewed connection
change. An approved portability/export operation creates a fresh logical dump
with permission `0600`, keeps credentials and contents out of logs, verifies the
target as required, and securely removes the temporary artifact afterward.
Retaining or scheduling logical dumps requires a separate reviewed policy that
defines freshness/RPO, encryption, access, storage failure domain, retention,
monitoring, and restore-drill cadence. Neither recovery path may overwrite or
rewire production automatically.

If the project becomes production-critical, begins holding data whose loss the
owner no longer accepts, or moves to Railway Pro, reassess this policy. Add
native manual/scheduled volume backups and a separately reviewed scheduled,
encrypted, access-restricted logical-dump copy outside the Railway project
failure boundary, with an explicit RPO, retention, failure alert, and recurring
restore-verification cadence. PITR remains required even if those layers are
later enabled.

### Cutover disposition

Production cutover may proceed without native Railway volume backups only after
this amendment is reviewed and explicitly approved and every mandatory item
above plus the remaining release gates passes. The existing successful PITR and
logical-dump restore evidence remains valid and is not repeated as part of this
design amendment. Until approval, `production-cutover-operations` remains
paused.

## Trust and security boundaries

The browser is untrusted. The Node service authenticates the session, derives
`user_id`, validates requests, enforces body limits, and uses parameterized SQL.
Client-supplied user IDs are never accepted. Database disclosure must not expose
plaintext passwords or usable session tokens. Logs/errors exclude passwords,
cookies, raw tokens, hashes/salts, names, database URLs, full bodies, and raw IPs.

### Password policy

- Username is 3–32 ASCII characters matching `[a-zA-Z0-9._-]+`; canonical form
  is ASCII lowercase while chosen spelling is preserved.
- Password is 12–128 Unicode code points and at most 1,024 UTF-8 bytes. Do not
  trim, case-fold, or normalize it.
- Hash with asynchronous native `node:crypto.argon2`: `argon2id`,
  `memory=19456` 1-KiB blocks (19 MiB), `passes=2`, `parallelism=1`, and
  `tagLength=32`. This is the OWASP minimum Argon2id profile at amendment time.
  Startup and CI fail if the pinned runtime or exact policy is unavailable.
- Use a fresh random 16-byte salt and strict format
  `v4$argon2id$m=19456,t=2,p=1,dk=32$<salt-base64url>$<tag-base64url>`.
  Reject missing, duplicated, reordered, unknown, non-canonical, out-of-range,
  or wrong-length data before KDF work.
- Compare equal-length tags with `timingSafeEqual`. Unknown users and unusable
  records perform one dummy current-policy derivation and return the same public
  failure as wrong passwords.
- Keep an allowlisted verifier registry. Rehash a supported older policy only
  after success, with fresh salt and compare-and-swap. Never weaken or use a
  fast-hash fallback.
- Experimental `v1` PBKDF2 and `v2`/`v3` scrypt rows are disposable. If any
  durable row is found, deployment stops for a separate reset/migration decision.

One bounded password-work service initially allows two active Argon2 jobs and a
FIFO queue of eight per replica. Excess work returns byte-equivalent `503
AUTH_BUSY`, `Cache-Control: no-store`, and `Retry-After: 1` before identifier
lookup. Preview load acceptance may reduce concurrency but cannot change KDF
parameters without review. Permits release in `finally`; shutdown stops new
admission and drains bounded work. Validate/rate-limit before admission. KDF
failure creates no account/session, returns generic `503 AUTH_UNAVAILABLE`, and
never triggers a weaker algorithm.

### Sessions

- Create a random 32-byte token; store only its SHA-256 digest. Send it once as
  `__Host-gm_session` with `Secure; HttpOnly; SameSite=Lax; Path=/`, no
  `Domain`, and matching 30-day `Max-Age`/`Expires`.
- PostgreSQL `expires_at` is authoritative. On login, transactionally revoke a
  valid incoming session, prune expired rows, insert the replacement, and cap
  the target user at ten active sessions.
- Logout is idempotent. Account deletion re-verifies the password and deletes
  all owned rows transactionally. Missing/malformed/expired/revoked tokens are
  externally identical.
- Local HTTP may use an environment-specific non-`__Host-` cookie. Production
  startup fails without HTTPS public origin and secure-cookie mode.

### CSRF and abuse controls

- Production API is same-origin; no wildcard CORS. State-changing requests need
  JSON where applicable and an `Origin` matching `PUBLIC_ORIGIN`.
- Set `Cache-Control: no-store` on auth, profile, and progress responses. Reject
  bodies over 16 KiB before parsing and progress payloads over 12 KiB.
- Registration/login use atomic PostgreSQL fixed-window counters keyed by action
  plus HMAC-SHA-256 of normalized username and coarse network prefix.
  `RATE_LIMIT_HMAC_KEY` is secret; rows contain no plaintext identifier/address
  and expire quickly.
- Derive network keys only from a preview-verified Railway ingress chain.
  Express `trust proxy` must describe exact trusted hops, never blindly accept
  forwarded headers. Unproven client-IP provenance blocks launch.
- Initial limits: registration 5/minute per username and 20/minute per network;
  login 10/minute per username and 30/minute per network. Responses never expose
  account existence; registration alone may disclose username unavailability.
- Apply `nosniff`, restrictive referrer/permissions policies, HSTS after HTTPS
  cutover, and a Vite-compatible CSP (report-only before enforcement).

## PostgreSQL model

Node generates UUIDv4 IDs. Times are `timestamptz`, serialized as UTC ISO-8601.

- `users(id uuid PK, username text, username_normalized text UNIQUE,
  password_hash text, created_at timestamptz, updated_at timestamptz)`.
- `profiles(user_id uuid PK/FK ON DELETE CASCADE, first_name text NULL,
  last_name text NULL, avatar_id text NULL, updated_at timestamptz)`.
- `sessions(token_hash bytea PK, user_id uuid FK ON DELETE CASCADE,
  created_at timestamptz, expires_at timestamptz)` with user/expiry indexes. Do
  not store IP or user agent.
- `lesson_progress(user_id uuid FK ON DELETE CASCADE, lesson_id text,
  schema_version integer, content_version integer, progress jsonb,
  revision integer, updated_at timestamptz, PK(user_id, lesson_id))`.
- `auth_rate_limits(action text, key_hash bytea, window_started_at timestamptz,
  request_count integer, expires_at timestamptz,
  PK(action, key_hash, window_started_at))` with expiry index.

Profiles keep optional trimmed 1–80-code-point names and a catalog avatar ID,
never a URL. Progress catalog initially contains only `stage-01-lesson-01`;
unknown IDs return `404 UNKNOWN_LESSON` before SQL. The JSON contains only
`currentStepId`, `completedStepIds`, `checkpointPassed`, and `completedAt`.
Audio/motion preferences, reflection, and transient state remain local.

Rate counters use one atomic upsert and bounded cleanup. Constraints are the
final uniqueness/ownership defense. Registration, session rotation/capping,
and account deletion use transactions. Use a bounded `pg.Pool`, finite statement
and transaction timeouts, and `finally` release. Readiness uses a short `SELECT
1`; liveness does not depend on PostgreSQL.

## API and client behavior

Base path is `/api/v1`, JSON UTF-8. Errors keep the stable
`{ error: { code, message, fields?, requestId } }` envelope. Use 400 malformed,
401 unauthenticated, 403 origin, 404 absent, 409 username/revision conflict, 413
too large, 415 media type, 422 invalid fields, 429 limited, 503 auth busy/
unavailable, and 500 unexpected failure.

| Method/path | Auth | Request | Success |
|---|---|---|---|
| `POST /auth/register` | no | `{ username, password }` | `201 { user }` + cookie |
| `POST /auth/login` | no | `{ username, password }` | `200 { user }` + cookie |
| `POST /auth/logout` | optional | `{}` | `204` + expired cookie |
| `GET /session` | optional | none | `200 { user: UserView | null }` |
| `PATCH /profile` | yes | subset of `{ firstName, lastName, avatarId }` | `200 { profile }` |
| `DELETE /account` | yes | `{ password }` | `204` + expired cookie |
| `GET /progress` | yes | none | `200 { items }` |
| `GET /progress/:lessonId` | yes | none | `200 { item }` or `404` |
| `PUT /progress/:lessonId` | yes | versioned progress + `baseRevision` | `200 { item }` |

`UserView` never contains credential/session material. Profile `null` clears a
field; omission preserves it. `baseRevision: 0` inserts; updates atomically
match/increment revision and return current data on `409 REVISION_CONFLICT`.

Render local state immediately and bootstrap session in the background. Network
failure differs from guest state. Registration/login may offer confirmed guest
progress merge; never delete valid local progress on auth success. Lesson 1
merge unions completed steps, ORs checkpoint pass, keeps earliest completion,
and selects the furthest unlocked stable step. Save locally first, then sync with
visible pending/synced/error and retry. Logout preserves device progress;
account caches are user-ID scoped. Shared-device clearing is explicit/confirmed.

Forms use visible labels, linked errors, keyboard operation, status regions,
and text-labeled avatar radios. Account deletion requires current password and
clear confirmation. Preserve 320 px layout, reduced motion, and existing lesson
accessibility.

## Migrations and transition

Checked-in PostgreSQL migrations live in a backend-owned directory and run via
`node-pg-migrate`. Railway's pre-deploy command runs them over private
networking; failure prevents release.

1. Use a PostgreSQL advisory lock against concurrent deploy races.
2. Use transactional migrations where supported.
3. Add before code requires; destructive work uses expand/migrate/contract.
4. Run empty/local and preview acceptance, back up production, then pre-deploy.
5. Prove provider-independent logical export and isolated restore before
   cutover. Under the accepted pet-project policy, securely remove the temporary
   drill artifact; do not retain or schedule dumps without a separately reviewed
   lifecycle policy.
6. D1 migrations are historical, not PostgreSQL inputs. With zero live users,
   create fresh schema and discard preview D1 auth data; no dual write/copy.
7. Browser progress uses the normal validated merge; malformed data keeps its
   current fallback.

## Development, deployment, and operations

Required typed startup configuration includes Railway `PORT` and private
`DATABASE_URL`; `NODE_ENV`, `APP_ENV`, `PUBLIC_ORIGIN`, deployment version;
secure-cookie mode; `RATE_LIMIT_HMAC_KEY`; pool/timeouts; and Argon2 admission
limits. Commit only a key-only `.env.example`; ignore local values. Railway
variables/reference variables hold deployed values. Never print config objects,
URLs, or secrets.

Local development uses repository Node 24 and a local PostgreSQL container at
the production major version. A checked-in Compose file may own only the local
database; the Node API remains a normal debuggable process. Vite proxies `/api`.
Ordinary work must not need a Railway account; a Railway tunnel is for explicit
preview administration.

Pull requests run lint/typecheck, frontend/server builds, unit tests, and fresh
PostgreSQL integration tests. Railway builds one web artifact, runs the
pre-deploy migration, checks readiness, and shifts traffic. Preview acceptance
precedes production.

Final cutover records the last good Pages commit/tag, smokes Railway, then
switches canonical origin and disables routine Pages deploy triggers in one
reviewed change. Code rollback selects a prior compatible Railway deployment;
migrations remain forward-compatible. Guest mode and the tagged Pages artifact
are the initial failure fallback.

Before production, satisfy Design Amendment 05: verify healthy PITR,
provider-independent logical export capability, successful isolated PITR and
logical-dump restore drills, and production readiness/health. PITR is the only
continuously maintained recovery copy; the drill artifact is temporary and does
not constitute a retained second layer. Native Railway volume backups are not
mandatory. Reopen the policy for Pro, production-critical use, or data whose
loss is no longer acceptable. Restore corrupt data into a new service for
verification before cutover; never automatically overwrite the source or clear
browser progress.

Emit structured JSON with application/request IDs, route template, method,
status, duration, deployment version, and coarse outcome. Railway supplies logs
and CPU/RAM/disk/network metrics, not application latency/error metrics; derive
the initial view from structured logs and add OpenTelemetry only if needed.
Monitor 5xx, database/pool/latency, auth busy/unavailable, 401/409/429 trends,
restarts, resources, backups, migrations, and health. The privacy notice covers
PITR retention and temporary approved logical-export handling accurately.

Database outage returns generic bounded 503 and never trusts unsigned client
claims; guest learning remains local. Pool saturation, invalid config, KDF
capability failure, migration failure, and unproven proxy semantics fail closed.
A single region is an accepted MVP tradeoff; HA needs a new design.

## Test and preview acceptance

Unit/service tests cover validation; strict `v4` vectors/grammar; dummy work;
constant-time comparison; rehash decisions; two-active/eight-queued FIFO
admission, error/shutdown release, and pre-lookup busy equivalence; sessions;
cookies; origins/media; trusted proxy parsing; HMAC limiter keys; atomic counter
decisions; progress merge; deployment gates; static/API routing; configuration;
and graceful shutdown.

PostgreSQL integration starts empty and checks all migrations, constraints, and
indexes; repeat migration safety; concurrent registration; login equivalence;
session rotation/restart/expiry/cap/logout; transaction rollback; rate-limit
upserts/cleanup; pool/statement failure; profile; progress concurrency,
isolation, size, and catalog bounds; and account cascades.

Railway preview acceptance must:

1. Prove the pinned runtime uses native asynchronous Argon2id with exact `v4`
   parameters for new, real, dummy, and confirmation work.
2. Run fixed vectors and at least 50 production-shaped derivations after warmup;
   record p50/p95 KDF/auth latency and CPU/RAM without secrets. The foundation
   slice defines thresholds from local/preview baselines before auth work.
3. Load-test two active jobs, bounded queue, excess `AUTH_BUSY`, and recovery
   after throws/timeouts. No OOM, restart, event-loop starvation, unbounded
   queue, or weaker fallback is acceptable.
4. Run register/login/wrong/unknown/unusable/confirmation/session-restart flows;
   prove no failure mutation and clean all acceptance rows.
5. Verify client-IP derivation and prove spoofed forwarded headers cannot choose
   a new network key; limits persist across web restarts.
6. Verify HTTPS cookies, origins/headers, SPA/API fallback, readiness, graceful
   deploy, migration-failure blocking, redaction, and environment isolation.
7. Inspect logs/resource graphs for the entire window. Leakage, OOM, unexplained
   restart/5xx, migration failure, or saturation fails acceptance.

Browser tests cover guest/offline use, account/profile/delete flows, restored
sessions, progress merge/status, Lesson 1 corruption/completion regression,
accessibility/mobile, and Pages-hidden versus Railway-preview entry points.

Before review of any implementation slice, run repository lint/build, relevant
tests, and `git diff --check`.

## Revised implementation slices

The approved `cloudflare-runtime-schema` slice remains immutable workflow
history but its architecture is superseded. It is not relabeled as failed and
is not a foundation for later slices. No code changes occur until this amendment
passes review and a new explicit `design_approval` gate.

1. **`cloudflare-runtime-schema` — completed historical, superseded.** Its
   Worker/D1 artifacts remain audit evidence only.
2. **`railway-node-postgres-foundation` — new replacement foundation.** Owns
   Node/Express, static/API routing, shutdown, configuration, `pg`, local
   PostgreSQL, all baseline tables/migrations, Railway config, health/readiness,
   JSON errors, Vite proxy/build gates, test harness, migration failure/race
   tests, obsolete Worker/D1 retirement, and recorded KDF thresholds. It exposes
   only health/readiness and no credentials/profile/progress/cutover.
3. **`auth-session-api` — revised.** Owns `v4` Argon2id, bounded admission,
   dummy/upgrade work, PostgreSQL rate limits, trusted ingress proof, auth/
   session/account routes, cookies, transactions, and preview auth acceptance.
   Existing Workers PBKDF2/scrypt code is superseded, not reusable as policy.
4. **`account-profile-ui` — behavior preserved.** Owns auth UI/provider,
   profile endpoint/UI, avatar catalog, deletion UX, accessibility, and
   Railway-build-only entry points before cutover.
5. **`progress-api-sync-core` — adapter changed.** Owns PostgreSQL endpoints,
   optimistic revisions, bounds/catalog, sync queue/status/retry, and merge APIs.
6. **`lesson-one-progress-migration` — behavior preserved.** Owns the Lesson 1
   adapter, guest import, user caches, confirmed merge, API sync, and save UI.
7. **`production-cutover-operations` — target changed.** Owns Railway config/
   CI, migrations, backups/restore, headers, smoke checks, monitoring/privacy,
   cost controls, canonical origin, and Pages shutdown. This is final.

After Design Review 07, the owner must explicitly approve `design_approval`.
The first legal implementation action is `railway-node-postgres-foundation`.

## Definition of done

- The historical Cloudflare slice and six Railway target slices remain visible;
  every remaining slice passes review and its human gate.
- Secure auth, sessions, profiles, deletion, and cross-device Lesson 1 progress
  work on the Railway same-origin deployment; guest mode survives API failure.
- Argon2id, PostgreSQL transactions/limits/migrations, PITR, verified on-demand
  logical export/restore capability, rollback, observability, privacy, and cost
  controls match this design and preview proof. The accepted single maintained
  recovery copy is disclosed accurately; native backups and scheduled retained
  logical dumps are future Pro, production-critical, or changed-risk
  enhancements rather than cutover requirements.
- Production uses Railway Node plus private PostgreSQL. Pages remains only the
  recorded initial static fallback or is retired after its rollback window.

## Sources consulted

- [Railway PostgreSQL](https://docs.railway.com/databases/postgresql)
- [Railway variables](https://docs.railway.com/variables)
- [Railway pre-deploy commands](https://docs.railway.com/deployments/pre-deploy-command)
- [Railway domains/private networking](https://docs.railway.com/networking/domains/working-with-domains)
- [Railway logs](https://docs.railway.com/observability/logs)
- [Railway metrics](https://docs.railway.com/observability/metrics)
- [Railway PostgreSQL backup/restore](https://docs.railway.com/guides/postgres-backups-restores)
- [Railway volume backups](https://docs.railway.com/volumes/backups)
- [Railway PostgreSQL PITR](https://docs.railway.com/volumes/point-in-time-recovery)
- [Railway pricing](https://docs.railway.com/pricing)
- [Railway serverless behavior](https://docs.railway.com/deployments/serverless)
- [Cloudflare Workers pricing](https://developers.cloudflare.com/workers/platform/pricing/)
- [Cloudflare D1 pricing](https://developers.cloudflare.com/d1/platform/pricing/)
- [Cloudflare D1 Time Travel](https://developers.cloudflare.com/d1/reference/time-travel/)
- [Node.js 24 `crypto.argon2`](https://nodejs.org/docs/latest-v24.x/api/crypto.html#cryptoargon2algorithm-parameters-callback)
- [OWASP Password Storage](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html)
- [OWASP Session Management](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html)
