# Design Review 07 — Railway Node/PostgreSQL architecture

## Review metadata

- **Work item:** `feature-auth-persistence`
- **Work-item type:** `technical_feature`
- **Design artifact:** `docs/technical-designs/feature-auth-persistence.md`
- **Amendment reviewed:** `railway-node-postgres-architecture-04`
- **Prior approved review:** `docs/reviews/feature-auth-persistence/design-review-06.md`
- **Replacement foundation slice:** `railway-node-postgres-foundation`
- **Workflow phase reviewed:** `design_review`
- **Date:** 2026-09-15
- **Verdict:** `APPROVED`

## Preflight

The workflow is consistent and authorizes this review. It identifies the work
item and technical-feature type, points to the existing authoritative design,
uses canonical `phase: design_review` with matching `next.phase`, has no open
gate or blocking findings, and references the existing Design Review 06 as the
latest immutable review. The proposed `railway-node-postgres-foundation` slice
exists in Amendment 04, precedes the revised `auth-session-api` slice, and does
not conflict with the approved historical `cloudflare-runtime-schema` record.

## Scope of review

This review assesses Architecture Design Amendment 04 as embodied in the
authoritative design. It covers the reason for leaving Workers/D1, Railway
service topology, Node/Express and PostgreSQL feasibility, authentication and
session security, data integrity, API compatibility, migrations, deployment,
rollback and recovery, privacy, observability, validation, and the revised
implementation slices. Amendments 01–03 and Design Reviews 03–06 remain
immutable historical evidence and are not reinterpreted as current
implementation instructions.

## Assessment

- **Goal clarity and scope:** The amendment clearly identifies the decisive
  problem—repeated deployed incompatibility between the selected password KDFs
  and the Worker isolate—and replaces the runtime and persistence architecture
  without reopening account, profile, progress, or lesson behavior. Recovery,
  uploads, analytics, high availability, Redis, and unrelated lesson-engine
  work remain explicit non-goals.
- **Architecture and feasibility:** One Node web service serving both the Vite
  SPA and `/api/v1/*`, plus a private PostgreSQL service per Railway
  environment, is a coherent same-origin replacement. Express, `pg`, explicit
  transactions, and checked-in `node-pg-migrate` migrations are conventional
  choices at this scale. Railway documents private database connectivity,
  pre-deploy commands with private-network and variable access, and deployment
  blocking when a pre-deploy command fails. The runtime exposes health and
  readiness separately, handles `PORT` and `SIGTERM`, and retains a safe Pages
  build until cutover.
- **Authentication and security:** The `v4` Argon2id policy exactly fixes the
  algorithm, memory, passes, parallelism, tag length, salt length, and strict
  stored format. Node documents native asynchronous Argon2 from v24.7 with the
  specified parameter model. Dummy current-policy work, strict parsing before
  KDF execution, constant-time tag comparison, a bounded admission service,
  generic busy/unavailable behavior, and a prohibition on weak fallback form a
  defensible password boundary. Session tokens are random, digest-only at rest,
  host-only and inaccessible to JavaScript; origin enforcement, request bounds,
  parameterized SQL, trusted-proxy proof, HMAC-pseudonymized limiter keys, and
  redacted logs address the principal browser, ingress, database, and privacy
  threats.
- **Data integrity and API contracts:** UUID ownership keys, unique canonical
  usernames, foreign-key cascades, transactional account/session operations,
  atomic fixed-window counters, catalog-bounded progress, and optimistic
  revisions preserve the prior product invariants using PostgreSQL primitives.
  The stable error envelope, status mapping, profile clearing semantics, and
  progress conflict contract remain deterministic. PostgreSQL time and JSON
  types improve the model without changing client behavior.
- **Migrations, deployment, and recovery:** Advisory-lock serialization,
  transactional and expand/migrate/contract rules, fresh-schema acceptance,
  and deployment-blocking pre-deploy migrations are appropriate. The lack of
  live D1 accounts makes fresh PostgreSQL initialization safer than a dual-write
  or copy path. Scheduled volume backups, a separately decided PITR policy,
  provider-independent dumps, restore rehearsal into a new target, compatible
  code rollback, and the tagged Pages fallback cover the material recovery
  modes. Railway documentation confirms that native backups and PITR have the
  described restore boundaries.
- **Deployment cost and availability:** The design accepts a single-region,
  single-replica MVP and explicitly defers HA. It requires paid production,
  usage controls, preview measurement before sizing, and a pricing recheck at
  cutover, so the higher and usage-sensitive Railway cost is visible rather
  than hidden. Database outage and saturation fail closed while guest learning
  remains local.
- **Privacy and operations:** Stored account data remains minimal, session
  secrets and network addresses are not retained, and logs exclude credentials,
  identifiers, profile names, connection strings, and full bodies. Structured
  logs plus Railway process/resource metrics provide a proportionate initial
  monitoring path, while backup retention and deletion limitations are assigned
  to the privacy notice and production runbook.
- **Validation strategy:** Unit, PostgreSQL integration, browser, deployment,
  and Railway-preview checks cover KDF capability and load, non-enumeration,
  session lifecycle, rate-limit persistence and proxy spoofing, migration
  failure, environment isolation, static/API routing, recovery, redaction,
  accessibility, and the Pages-versus-Railway capability gate. Requiring real
  preview evidence before auth-slice review directly addresses the failure mode
  that invalidated the Workers design.
- **Slice boundaries and abstraction:** The historical Worker/D1 foundation is
  preserved as approved-but-superseded evidence. The replacement foundation
  owns only runtime, persistence, migration, routing, configuration, retirement,
  and test scaffolding; it exposes no account feature. Auth, UI, generic sync,
  Lesson 1 adaptation, and final operations remain separately reviewable. The
  seven visible entries represent one historical slice plus six Railway target
  slices, not an invented extra implementation step. Express and explicit SQL
  are justified by the selected architecture and learning goal; no speculative
  framework, ORM, cache, or distributed subsystem is introduced.

No actionable blocking findings remain.

## Non-blocking implementation obligation

### LOW-03 — Prove the ten-session cap under concurrent login

The design requires session correctness to remain replica-safe, describes SQL
transactions and row locks, and caps each user at ten active sessions. A plain
read/prune/insert transaction at PostgreSQL's default isolation can still let
simultaneous logins observe the same pre-insert count and commit more than ten
rows. This does not require another design cycle because the amendment already
requires row-lock-based transactional behavior and the exact external invariant
is unambiguous.

The `auth-session-api` implementation must serialize cap-changing operations per
target user—for example by locking the owning user row inside the session
transaction or by an equivalent transaction-scoped mechanism—and add a
concurrent threshold test proving no committed outcome exceeds ten active
sessions. Implementation review should treat an unproved or race-prone cap as a
failure of the approved replica-safe contract.

## Sources verified

- Railway PostgreSQL private-by-default service and connection variables:
  <https://docs.railway.com/databases/postgresql>
- Railway pre-deploy private-network access and failure behavior:
  <https://docs.railway.com/deployments/pre-deploy-command>
- Railway backup, PITR, logical-dump, and restore boundaries:
  <https://docs.railway.com/guides/postgres-backups-restores>
- Railway plans and usage-based resource pricing:
  <https://docs.railway.com/pricing/plans>
- Node.js 24 asynchronous native Argon2 API and parameters:
  <https://nodejs.org/docs/latest-v24.x/api/crypto.html#cryptoargon2algorithm-parameters-callback>
- OWASP password-storage recommendations:
  <https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html>
- OWASP session-management recommendations:
  <https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html>

## Verdict and gate recommendation

**Verdict: `APPROVED`**

Open a new `design_approval` human gate. No application implementation is
authorized until the owner explicitly approves it. After approval, the first
legal implementation action is `railway-node-postgres-foundation`; the
historical `cloudflare-runtime-schema` slice remains approved but
architecture-superseded, and the partially implemented Worker auth work remains
unauthorized as current policy.

## Exact verdict

APPROVED
