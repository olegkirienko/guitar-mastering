# Authentication and persistence foundation

## Status and scope

This document is the authoritative technical design for `feature-auth-persistence`.
It defines the first server-side foundation for accounts, profiles, sessions, and
lesson progress. It is a design artifact, not an implementation.

The current application is a React/Vite single-page application deployed to
GitHub Pages. Lesson 1 owns a validated `localStorage` snapshot in
`src/pages/LessonOnePage.tsx`. The proposed architecture keeps the course usable
without an account while adding same-origin APIs and durable cross-device
progress for authenticated learners.

## Goals

- Let a learner register and sign in with a unique username and password.
- Maintain revocable server-side sessions without exposing session secrets to
  JavaScript.
- Store an optional first name, optional last name, and one avatar selected from
  an application-owned catalog.
- Persist lesson progress per authenticated user and reconcile it safely with
  existing guest progress.
- Keep the lesson fully usable when signed out, offline after load, or when the
  persistence API is temporarily unavailable.
- Establish a deployable Cloudflare Workers + D1 runtime with migrations,
  validation, tests, observability, and rollback procedures.
- Preserve the existing lesson completion semantics. Server persistence is a
  convenience and continuity feature, not proof of assessment integrity.

## Non-goals

- Social login, passkeys, MFA, roles, administration, subscriptions, or public
  profiles.
- Email or phone collection in the MVP. Email would add personally identifiable
  data without providing recovery until verification and outbound mail exist.
- Password reset or username change. The UI must state before registration that
  there is no automated recovery in this slice set.
- User-uploaded avatars or object storage.
- Analytics, streaks, scoring, leaderboards, or certification.
- Persisting transient animation frames, audio nodes, predictions, attempts,
  checkpoint ordering, or private reflection text.
- A universal lesson engine or a redesign of lesson content.
- Multi-region sharding or D1 read replication for the initial expected scale.

## Architecture decision

Use one Cloudflare Worker to serve the built SPA as static assets and handle
same-origin `/api/v1/*` requests, with one D1 database per environment.

This is preferred over keeping the frontend on GitHub Pages and hosting only an
API elsewhere because same-origin deployment gives session cookies a narrow
scope, avoids CORS and cross-site cookie configuration, and makes CSRF origin
checks straightforward. D1 is a good fit for a small relational account model,
unique usernames, revocable sessions, and one bounded progress row per user and
lesson. It also supplies versioned SQL migrations and point-in-time recovery.

The Worker should use platform APIs and a small explicit route table rather than
adding a server framework. Cloudflare bindings provide D1 and rate limiting.
Wrangler is the only required platform development dependency. Password hashing
uses Web Crypto PBKDF2, avoiding a JavaScript/Wasm password-hashing dependency
and its memory pressure.

### Runtime topology

```text
browser
  ├─ GET /assets/*, navigation ──> Worker Static Assets ──> dist/
  └─ /api/v1/* ────────────────> Worker router
                                      ├─ D1 binding: DB
                                      └─ rate-limit bindings
```

- Configure `assets.directory = "./dist"` and SPA fallback.
- Run Worker code first only for `/api/*`; hashed assets remain asset-first.
- Keep `HashRouter` during this work item to avoid coupling auth to a router
  migration. Change Vite's production base from `/guitar-mastering/` to `/`
  when the Worker becomes the production origin.
- Introduce an explicit build-time deployment target in slice 1. A Pages build
  uses `VITE_DEPLOY_TARGET=pages`, keeps `base: /guitar-mastering/`, and compiles
  account/profile/sync entry points out of the rendered application. A Worker
  preview build uses `VITE_DEPLOY_TARGET=worker`, uses `base: /`, and enables
  those capabilities. Missing or invalid production configuration fails closed
  to the Pages-safe build; client-side URL or storage overrides are not allowed.
- Return JSON for every API path, including 404 and 405; never let an unknown
  API path fall through to `index.html`.
- Use separate local/preview and production D1 databases. Production credentials
  and the Cloudflare account ID live in GitHub secrets, never in the repository.

## Trust and security boundaries

The browser is untrusted. It may submit arbitrary profile or progress data and
may call endpoints out of sequence. The Worker authenticates the session,
derives `user_id` from it, validates every request, enforces body-size limits,
and uses bound D1 prepared statements. A client-supplied user ID is never
accepted.

D1 is trusted storage but a database disclosure must not reveal plaintext
passwords or usable session tokens. Logs and error responses must not contain
passwords, cookies, raw session tokens, password hashes, profile names, or full
request bodies.

### Password rules and storage

- Username: 3–32 ASCII characters matching `[a-zA-Z0-9._-]+`.
- Canonical username: Unicode-independent ASCII lowercase. Store the chosen
  spelling for display and enforce uniqueness on the canonical value.
- Password: 12–128 Unicode code points and at most 1,024 UTF-8 bytes. Do not
  trim, case-fold, or normalize it. Accept spaces and all printable Unicode.
- Hash with PBKDF2-HMAC-SHA-256 through Web Crypto, 600,000 iterations, a random
  16-byte salt, and a 32-byte derived key. Store algorithm, iteration count,
  salt, and hash in a parseable versioned string.
- Generate salts and tokens with `crypto.getRandomValues`. Compare derived keys
  in constant time. Rehash on a successful login when the stored work factor is
  below the current policy.
- Enforce request limits before hashing. Login returns the same status and
  generic message for an unknown username and a wrong password; run a dummy
  hash for unknown users to reduce timing-based enumeration.

PBKDF2 is selected here because Workers provides a native Web Crypto
implementation and the OWASP-recommended scrypt memory setting approaches the
Worker's 128 MB isolate limit. The work factor must be benchmarked in the
deployed Worker before launch. If it repeatedly violates the chosen Workers plan
CPU budget, production launch is blocked until the plan or hashing architecture
changes; lowering below the documented policy is not an automatic fallback.

### Sessions

- On successful registration or login, create a random 32-byte opaque token.
- Store only `SHA-256(token)` as lowercase hex in D1. Send the raw token once in
  `__Host-gm_session` with `Secure; HttpOnly; SameSite=Lax; Path=/`, no
  `Domain` attribute, `Max-Age=2592000`, and an `Expires` value calculated from
  the same server instant as the database expiry.
- Sessions expire after 30 days absolutely. Do not write `last_seen_at` on every
  request. The database `expires_at` is authoritative; the cookie expiry must
  never be later. A future idle-expiry policy can be added without changing the
  token representation.
- Rotate the browser session on every successful login. If the request carries
  a currently valid session cookie, delete that session row in the same D1 batch
  that creates the new session, even when the credentials select a different
  account. Prune expired rows, create the replacement, then enforce the target
  user's ten-session cap within that batch. A malformed, expired, or already
  revoked incoming token needs no additional deletion and does not change the
  generic login response.
- Logout deletes the current row and expires the cookie even if the row is
  already absent. Logout and account deletion clear the cookie with the same
  `Path`, `Secure`, `HttpOnly`, and `SameSite` attributes plus `Max-Age=0` and an
  `Expires` date in the past.
- Registration and login cap the target user at ten active sessions by deleting
  expired sessions and then the oldest surplus sessions in the same D1 batch.
- Authentication treats missing, malformed, expired, or revoked tokens alike.
  Expired rows may be deleted opportunistically after the response.
- Local development may use an environment-specific non-`__Host-` cookie only
  when the local runtime cannot provide HTTPS; production must fail closed if
  secure-cookie configuration is disabled.

### CSRF, browser, and abuse controls

- All API requests are same-origin. Do not enable wildcard CORS.
- For `POST`, `PUT`, `PATCH`, and `DELETE`, require `Content-Type:
  application/json` where a body exists and require the `Origin` header to match
  the configured public origin. Reject missing or mismatched origins in
  production. `SameSite=Lax` is defense in depth, not the only CSRF control.
- Set `Cache-Control: no-store` on auth, profile, and progress responses.
- Apply route-specific Worker rate-limit bindings to registration and login.
  Use a hash of the normalized username as one key and a coarse network-derived
  key as a second signal. Because the platform limiter is permissive and
  location-local, it is abuse reduction rather than a strict lockout system.
  Login failures and rate-limit responses must not expose whether a named
  account exists. Registration intentionally discloses username availability:
  a normalized-username collision returns `409 USERNAME_UNAVAILABLE`. This is
  an accepted MVP tradeoff because username is the sole public registration
  identifier; no separate availability endpoint is provided.
- Reject bodies over 16 KiB before JSON parsing. Progress payload itself is
  capped at 12 KiB.
- Add baseline response headers: `X-Content-Type-Options: nosniff`, a restrictive
  `Referrer-Policy`, `Permissions-Policy` disabling unused capabilities, and a
  CSP compatible with the Vite bundle. CSP rollout begins in report-only mode
  and becomes enforcing before production cutover.

## Data model

All IDs are UUID strings generated by the Worker. Times are UTC epoch seconds.
Foreign keys are enabled in every migration and request path that depends on
them. SQL uses `STRICT` tables when supported by the local and deployed D1
versions.

### `users`

| Column | Type | Constraints / meaning |
|---|---|---|
| `id` | TEXT | primary key |
| `username` | TEXT | chosen display spelling |
| `username_normalized` | TEXT | unique, indexed login key |
| `password_hash` | TEXT | versioned PBKDF2 representation |
| `created_at` | INTEGER | required |
| `updated_at` | INTEGER | required |

### `profiles`

| Column | Type | Constraints / meaning |
|---|---|---|
| `user_id` | TEXT | primary key, FK users with cascade delete |
| `first_name` | TEXT | nullable, trimmed, 1–80 code points when present |
| `last_name` | TEXT | nullable, trimmed, 1–80 code points when present |
| `avatar_id` | TEXT | nullable, validated against a versioned app catalog |
| `updated_at` | INTEGER | required |

Names are private account data and are never used as login identifiers. Empty
strings become `NULL`. `avatar_id` is an identifier such as `guitar-sun-01`, not
a URL. The client and Worker share the allowed catalog constants.

### `sessions`

| Column | Type | Constraints / meaning |
|---|---|---|
| `token_hash` | TEXT | primary key; SHA-256 of opaque token |
| `user_id` | TEXT | indexed FK users with cascade delete |
| `created_at` | INTEGER | required |
| `expires_at` | INTEGER | required and indexed |

Do not store IP addresses or user-agent strings in the MVP.

### `lesson_progress`

| Column | Type | Constraints / meaning |
|---|---|---|
| `user_id` | TEXT | FK users with cascade delete |
| `lesson_id` | TEXT | application lesson identifier |
| `schema_version` | INTEGER | envelope version |
| `content_version` | INTEGER | lesson-defined content version |
| `progress_json` | TEXT | bounded validated JSON snapshot |
| `revision` | INTEGER | optimistic concurrency counter, starts at 1 |
| `updated_at` | INTEGER | server time |

Primary key is `(user_id, lesson_id)`. The Worker owns a versioned catalog of
server-supported lesson IDs; initially it contains only
`stage-01-lesson-01`. Progress reads and writes accept only IDs in that catalog.
`GET /progress` queries only catalog IDs, so its response is bounded by the
catalog size, and unknown path IDs return `404 UNKNOWN_LESSON` before any D1
read or write. Adding a lesson requires a reviewed server catalog change and its
progress schema/adapter; syntactically valid arbitrary IDs are not forward
compatible input.

The JSON payload contains only durable learning state: `currentStepId`,
`completedStepIds`, `checkpointPassed`, and
`completedAt`. `audioEnabled` and manual/static motion preferences remain local
device settings because automatic cross-device restoration can be surprising or
unsafe. Private reflection and transient interaction state are excluded.

The Worker validates catalog membership, the envelope, supported schema version,
JSON shape, scalar/array limits, and total bytes. It does not treat progress as a
security credential. Lesson-specific adapters in the client validate known step
IDs and preserve pedagogical invariants before rendering. Catalog membership
bounds each account to one row per supported lesson; body-size and revision
checks still bound each write.

## API contract

Base path: `/api/v1`. JSON responses use UTF-8. Successful mutation responses
return the canonical server representation when one exists.

Errors have one stable shape:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Check the highlighted fields.",
    "fields": { "username": "USERNAME_UNAVAILABLE" },
    "requestId": "..."
  }
}
```

Messages are safe for display; codes drive client behavior. Unexpected failures
return `INTERNAL_ERROR` without implementation details. Use 400 malformed JSON,
401 unauthenticated, 403 origin rejection, 404 resource absent, 409 username or
revision conflict, 413 body too large, 415 wrong media type, 422 valid JSON with
invalid fields, 429 rate limited, and 500 unexpected failure.

`USERNAME_UNAVAILABLE` is intentionally observable only from registration.
Unknown-user and wrong-password login attempts share the same status, code,
message, and comparable hashing work. `UNKNOWN_LESSON` is a `404` and never
creates a progress row.

### Authentication and account

| Method and path | Auth | Request | Success |
|---|---|---|---|
| `POST /auth/register` | no | `{ username, password }` | `201 { user }` + session cookie |
| `POST /auth/login` | no | `{ username, password }` | `200 { user }` + session cookie |
| `POST /auth/logout` | optional | `{}` | `204` + expired cookie |
| `GET /session` | optional | none | `200 { user: UserView | null }` |
| `DELETE /account` | yes | `{ password }` | `204` + expired cookie |

`UserView` contains `id`, `username`, `profile`, and `createdAt`, never hash or
session data. Account deletion re-verifies the password and deletes user,
profile, sessions, and progress through foreign-key cascades in one transaction.

### Profile

| Method and path | Auth | Request | Success |
|---|---|---|---|
| `PATCH /profile` | yes | any subset of `{ firstName, lastName, avatarId }` | `200 { profile }` |

An explicit `null` clears a field; omission leaves it unchanged. Unknown keys are
rejected. Profile changes do not affect authentication.

### Progress

| Method and path | Auth | Request | Success |
|---|---|---|---|
| `GET /progress` | yes | none | `200 { items: ProgressRecord[] }` |
| `GET /progress/:lessonId` | yes | none | `200 { item }` or `404` |
| `PUT /progress/:lessonId` | yes | `{ baseRevision, schemaVersion, contentVersion, progress }` | `200 { item }` |

`baseRevision: 0` creates an absent row. A later write performs an atomic
`UPDATE ... WHERE revision = ?`, increments the revision, and returns `409
REVISION_CONFLICT` with the current record when no row matched. The client merges
and retries once; further conflict remains visible as an unsynced local state.
All SQL inputs are bound parameters.

The collection contains at most one item for every ID in the server's supported
lesson catalog. Pagination is unnecessary while that catalog remains small; if
the catalog later outgrows the documented response budget, pagination must be
designed before expanding it rather than allowing an unbounded response.

## Client behavior and user flows

### Bootstrap

The application renders immediately from local state and requests `GET
/api/v1/session` in the background. A small auth provider owns
`loading | guest | authenticated` plus profile data. A network error is distinct
from `guest`; it must not log out the visible client state or erase progress.

### Registration

1. Learner opens an accessible registration form and sees username/password
   rules plus the lack of automated recovery.
2. Client validates for quick feedback; server repeats all validation.
3. On `201`, the session cookie is already set and the app announces success.
4. If validated guest progress exists, the app offers to add that progress to
   the new account. On confirmation, the sync service compares it with server
   progress, merges, writes through the revision API, and only then marks it
   synced. Declining keeps the guest snapshot separate.
5. Local progress remains as a recoverable cache; it is never deleted merely
   because registration succeeded.

### Login and merge

After login, fetch all remote progress and merge each known lesson with the
matching account-scoped local cache. If separate guest progress exists, show its
lesson/completion summary and require confirmation before importing it. For
Lesson 1:

- union valid completed step IDs;
- `checkpointPassed` is logical OR;
- keep the earliest valid `completedAt` when both are complete;
- choose the furthest unlocked stable step implied by merged completion, while
  permitting later user navigation backward locally;
- validate both sides with the Lesson 1 adapter before merging;
- keep device-only audio and motion preferences from the current device.

Write a changed merge with the fetched server revision. A conflict triggers one
refetch/merge/retry. Never replace a valid local completion with an older or
malformed remote snapshot.

### Guest and failure behavior

- Signed-out learners continue using the current local persistence behavior.
- Lesson actions update local state first. Authenticated state then syncs in the
  background with `pending`, `synced`, or `error` status.
- API failure does not block lesson navigation or completion. Show a concise
  persistent status and a retry action; avoid a toast for every autosave.
- Debounce ordinary progress writes and flush important transitions such as
  checkpoint pass and lesson completion immediately. Do not claim a successful
  server save until the API acknowledges it.
- Logout ends the server session but leaves local course progress on the device.
  Account caches are namespaced by immutable user ID and are never displayed to
  a guest or merged into another account. The legacy Lesson 1 storage key is
  treated as guest data. The UI must explain this on shared devices and offer
  separate “clear this account's local cache” and “clear guest progress” actions;
  clearing requires explicit confirmation.

### Profile and account deletion

Profile fields have visible labels, inline errors linked with
`aria-describedby`, keyboard operation, and a status region for save results.
Avatar choices are radio options with text names, not image-only controls.
Account deletion requires the current password and a clear destructive
confirmation. A failed delete leaves the account and local progress untouched.

## Validation and consistency

- Centralize request parsing and pure validators in Worker modules; share only
  platform-neutral constants/types with the client.
- Database constraints are the final defense for uniqueness and ownership.
- Registration inserts `users`, `profiles`, and `sessions` in one D1 batch so a
  failure rolls back the full operation.
- Progress uses optimistic revisions. The API returns server time and revision;
  client clocks do not decide the winner.
- A row written by a newer deployment may become unknown after a code rollback.
  Such a row remains stored and readable as an opaque record but is not rendered
  or overwritten until a compatible adapter exists.
- Maintain the current corruption-tolerant local reader during migration.

## Migrations and compatibility

Use checked-in numbered SQL migrations under `migrations/`, applied with
Wrangler separately to local/preview and production database names. The first
migration creates the four tables, indexes, constraints, and foreign keys.

Migration policy:

1. Additive schema changes deploy before code that requires them.
2. Destructive changes require an expand/migrate/contract sequence in separate
   deployments; this work item contains no destructive production migration.
3. Run migrations against preview, execute API integration tests, record a D1
   Time Travel bookmark for production, apply production migrations, then deploy
   the compatible Worker.
4. Never run remote migrations from an unreviewed pull request.
5. Local browser progress needs no destructive migration. It is validated and
   imported through the same merge adapter; malformed data falls back exactly as
   the current lesson does.

## Deployment, operations, and rollback

### Delivery

- Pull requests run install, lint, build, Worker tests, and local-D1 integration
  tests. They may upload a preview Worker only when preview credentials and a
  dedicated preview D1 database are configured.
- Production deploy runs on `main` after validation and migration approval using
  the official Wrangler GitHub Action with least-privilege
  `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` secrets.
- Through slices 1–5, the existing GitHub Pages workflow remains the canonical
  production deploy and explicitly builds `VITE_DEPLOY_TARGET=pages`. Automated
  checks assert its `/guitar-mastering/` base and the absence of account,
  profile, and sync entry points. Worker preview deploys explicitly build
  `VITE_DEPLOY_TARGET=worker`; all account and progress acceptance tests run
  there. Thus merging a pre-cutover slice cannot advertise a feature whose API
  is absent from the Pages origin.
- Slice 6 is the only cutover slice. Before merge, deploy the candidate Worker
  and production D1, run migrations and smoke tests at the Worker URL, and
  record the currently deployed Pages commit as an annotated rollback tag. In
  the same reviewed cutover change, disable the Pages workflow's `push` and
  `workflow_dispatch` deploy triggers, make the production/canonical build use
  `VITE_DEPLOY_TARGET=worker`, and update the advertised origin. Disabling the
  workflow does not delete its last deployed artifact; document its URL, tag,
  and verification result in the runbook. A dedicated, manual rollback
  procedure may rebuild that tag with `VITE_DEPLOY_TARGET=pages`, but routine
  post-cutover commits must never overwrite the fallback.
- Health checks cover static `/`, `/api/v1/session`, D1 connectivity through a
  non-sensitive readiness query, security headers, and cookie flags.

### Observability and privacy

- Emit structured route, method, response status, duration, deployment version,
  and random request ID. Use coarse auth outcomes such as `login_failed`; never
  log identifiers or credentials.
- Monitor 5xx, D1 errors/latency, 401 trends, 409 progress conflicts, 429s, and
  deployment health. Rate-limit events may use aggregate telemetry only.
- Retain only data needed to provide accounts and progress. No IP/user-agent is
  stored in application tables. Deleting an account removes all application
  rows. D1 operational backups may retain deleted data within the provider's
  documented Time Travel window; state this in the privacy notice.

### Rollback

- Worker code rollback uses a previous compatible version. Database migrations
  remain forward-compatible during the rollback window.
- If the Worker/API is unhealthy, the static course continues in local guest
  mode and reports sync unavailable. The prior GitHub Pages deployment is the
  temporary static fallback during initial cutover.
- For corrupting database operations, stop writes, capture the current bookmark,
  and use D1 Time Travel only through an explicitly approved incident procedure;
  restoration overwrites the database and is not an automatic deploy step.
- Never roll back by clearing browser progress or dropping tables.

## Test strategy

### Unit

- Username/profile/password validators, byte and code-point limits.
- PBKDF2 encode/parse/verify, dummy verification, token hashing, cookie creation.
- Session expiry and auth middleware.
- Progress envelope validation and Lesson 1 local/remote merge properties:
  idempotence, commutativity for achievement fields, no completion regression,
  and malformed-input fallback.
- Deployment-target parsing fails closed; Pages and Worker builds expose only
  their intended capability set and use their intended Vite base.
- Error mapping and origin/media-type enforcement.

### Worker and D1 integration

- Apply migrations to a fresh local D1 database and inspect constraints/indexes.
- Register, duplicate username with case variants, login success/failure, session
  rotation, logout/revocation, expiry, and account cascade deletion. Verify that
  duplicate registration returns `USERNAME_UNAVAILABLE`, while unknown-user and
  wrong-password login responses are indistinguishable.
- Verify browser restart restores an unexpired persistent cookie, expiry at the
  server boundary rejects it, cookie expiry never exceeds row expiry, and login
  with a valid cookie atomically revokes the incoming session and issues one
  replacement.
- Profile set/clear and invalid avatar/name cases.
- Progress create/read/update, cross-user isolation, oversize rejection,
  revision conflict, and retry behavior. Verify unknown lesson IDs return
  `404 UNKNOWN_LESSON` without a row, and collection reads never exceed the
  supported catalog cardinality.
- Atomic rollback when one statement in registration/deletion fails.

### Browser/component

- Guest path remains usable with API offline.
- Register/login/logout/profile flows, restored session, sync statuses, and
  deterministic local/remote merge.
- Existing Lesson 1 completion and corrupt-local-storage cases do not regress.
- Keyboard-only and screen-reader form/status behavior; 320 px layout; disabled
  motion and audio preferences remain device-local.
- Cookie flags and security headers in a deployed preview.
- Account routes and controls are absent from the Pages build through slice 5,
  while the same revision exposes them in the Worker preview build.

Before each implementation slice is offered for review, run the repository's
lint/build commands, relevant tests, and `git diff --check`.

## Implementation slices

Slices are ordered and independently reviewable. A later slice is not authorized
until the preceding review and human gate complete.

### 1. `cloudflare-runtime-schema` — runtime and persistence skeleton

Owns Wrangler configuration, Worker entry/router, static asset fallback,
environment typing, local/preview D1 binding, initial SQL migration, health/error
primitives, test harness, and the fail-closed `VITE_DEPLOY_TARGET` build contract.
It adds automated Pages/Worker base and capability-gate assertions. It may expose
only health/readiness API behavior.
It must not implement credentials, auth UI, profile mutation, progress sync, or
production cutover.

Acceptance: the SPA and API route correctly under local Wrangler; a fresh local
D1 applies the migration; unknown API routes stay JSON; the Pages build retains
its current base and contains no account entry points; the Worker preview build
uses the root base; existing frontend build passes.

### 2. `auth-session-api` — credentials and server sessions

Owns username/password validation, PBKDF2 utilities, register/login/logout,
session lookup middleware, secure cookie handling, session limits, origin/media
checks, explicit registration-disclosure behavior, auth rate limiting, and auth
API tests. No auth/profile UI and no lesson progress endpoint.

Acceptance: all auth/session security and failure cases above pass locally and
against a preview runtime, including persistent-cookie restart/expiry and atomic
replacement of an incoming valid session; password/hash/token material never
appears in API responses or logs.

### 3. `account-profile-ui` — account experience

Owns the client auth provider, registration/login/logout forms, session
bootstrap, profile read/update UI and endpoint, fixed avatar catalog, account
deletion flow, accessible statuses/errors, and navigation entry points. It does
not change lesson progress ownership or synchronization. All entry points are
reachable only in the Worker-capable build and are absent from Pages production.

Acceptance: guest and authenticated navigation work; profile fields and deletion
obey validation/accessibility/privacy rules; API outages do not break the course.

### 4. `progress-api-sync-core` — generic durable progress transport

Owns progress API endpoints, optimistic revisions, bounded envelope validation,
the versioned server lesson catalog and unknown-lesson rejection, client sync
queue/status, retry policy, and pure reconciliation interfaces. It does not move
Lesson 1 state out of its page or change completion rules. Sync UI remains behind
the Worker capability gate.

Acceptance: ownership isolation, create/update/conflict paths, unknown-ID
rejection, catalog-bounded collection reads, offline local-first behavior, and
retry semantics have automated coverage.

### 5. `lesson-one-progress-migration` — first real adapter

Owns extracting Lesson 1's durable progress adapter/repository, importing the
existing storage key into a guest namespace, user-ID-scoped local caches,
confirmed guest import, deterministic account merge, server sync integration,
and save-status UI. It preserves all approved Lesson 1 pedagogy and retains
audio and motion preferences locally. It does not implement Lesson 2.
Authenticated import/sync entry points remain absent from the Pages build.

Acceptance: existing/malformed local snapshots, anonymous completion,
registration import, login conflict, cross-device restore, logout, shared-device
warning, API failure, and retry are verified without completion regression.

### 6. `production-cutover-operations` — deploy and hardening

Owns production/preview configuration, CI deployment, migration runbook,
security-header enforcement, smoke checks, monitoring documentation, privacy
notice updates, canonical-origin/base configuration, and staged removal or
disabling of the GitHub Pages production deploy. It performs the atomic release
strategy defined above: verify the Worker candidate, preserve and tag the last
known-good Pages artifact, disable Pages deploy triggers, then enable the Worker
capability build and update the canonical origin in one reviewed cutover.

Acceptance: production migration and deploy steps are reproducible; preview and
production databases are isolated; smoke checks pass; Pages can no longer be
overwritten by routine pushes; the fallback artifact/tag is recorded and its
manual recovery is rehearsed; the canonical Worker build exposes the account
capabilities with root-relative assets; no secret is committed. This is the
final slice.

## Definition of done

- All six approved slices have passed implementation review and their human
  gates.
- Username/password auth, revocable sessions, optional profile fields, avatar
  selection, account deletion, and cross-device Lesson 1 progress work on the
  deployed same-origin application.
- Guest/local-first learning remains fully functional during sign-out and API
  failure, with truthful sync messaging.
- Security controls, migration/rollback procedures, automated validation, and
  privacy behavior match this design.
- Production uses Cloudflare Workers Static Assets + D1, with GitHub Pages kept
  only as the documented initial rollback artifact or retired after the rollback
  window.

## External platform references

- [Cloudflare Workers SPA static assets](https://developers.cloudflare.com/workers/static-assets/routing/single-page-application/)
- [Cloudflare static-asset routing and bindings](https://developers.cloudflare.com/workers/static-assets/binding/)
- [Cloudflare D1 migrations](https://developers.cloudflare.com/d1/reference/migrations/)
- [Cloudflare D1 prepared statements](https://developers.cloudflare.com/d1/worker-api/prepared-statements/)
- [Cloudflare D1 batch transactions](https://developers.cloudflare.com/d1/worker-api/d1-database/)
- [Cloudflare D1 limits](https://developers.cloudflare.com/d1/platform/limits/)
- [Cloudflare D1 Time Travel](https://developers.cloudflare.com/d1/reference/time-travel/)
- [Cloudflare Workers Web Crypto](https://developers.cloudflare.com/workers/runtime-apis/web-crypto/)
- [Cloudflare Workers limits](https://developers.cloudflare.com/workers/platform/limits/)
- [Cloudflare Workers rate limiting](https://developers.cloudflare.com/workers/runtime-apis/bindings/rate-limit/)
- [Cloudflare GitHub Actions deployment](https://developers.cloudflare.com/workers/ci-cd/external-cicd/github-actions/)
- [OWASP Password Storage Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html)
- [OWASP Session Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html)
