# Production cutover evidence — 2026-09-17

## Platform state

- Railway project `112644ba-cb91-443b-ae4b-73a0d6f74b69`, production environment
  `994fd373-dd1d-4073-8b7f-116e77d898fa`.
- Production PostgreSQL `82d4b5e1-830a-4467-bb1f-f9448fd1d58d` is isolated
  from preview, running, volume-backed, and has no public TCP proxy.
- PITR is enabled and its archive bucket is wired.
- The live PITR probe succeeds over the registered Railway SSH key. It reports
  one backup set, a healthy archiver, and recoverable coverage through
  `2026-09-17T08:43:43.525592Z` at drill time.
- Production web `4d0a3739-0beb-4ea9-9a7f3494708e` has an isolated database
  reference, production/secure-cookie mode, a generated HMAC secret, one replica,
  sleeping disabled, blocking migrations, readiness gating, and bounded restart.
- The first upload (`130a66bf-d27c-4eb3-a649-45641dfd47aa`) lacked service
  configuration and crashed before serving traffic. It was replaced and is now
  `REMOVED`; it is not an accepted release.
- Corrected deployment `fbb100d3-3742-4c25-a7a6-370ee8281f30` reached `SUCCESS`
  and proved the migration/readiness configuration. Its pre-deploy log records
  migration `001_baseline` completing before the web container became ready.
- Final candidate deployment `3c577338-f883-4b86-adbd-439fad684178` includes the
  user-facing privacy disclosure and corrected smoke utility, reached `SUCCESS`,
  and passed the complete HTTPS smoke. The prior corrected deployment is now
  `REMOVED` after the normal replacement.

## Acceptance

Local Node `24.7.0` validation passed:

- `pnpm lint`;
- `pnpm test` — 13 files passed, 3 PostgreSQL-gated files skipped, 62 tests
  passed, 19 skipped;
- `pnpm test:postgres` — 3 files and 19 tests passed;
- `pnpm test:browser` — Chrome, 10 tests passed;
- `pnpm build:pages` and `pnpm build:railway`;
- `git diff --check`.

The HTTPS production smoke passed for health, database readiness, unknown-API
JSON behavior, SPA delivery, no-store/no-cache behavior, HSTS, CSP report-only,
permissions/referrer policy, and `nosniff`.

The smoke window recorded four HTTP requests: three 2xx, one expected 404, zero
5xx, p95 116 ms. Web CPU peaked near 0.026 vCPU. Memory peaked near 148 MB of a
1 GB limit. Logs showed no secret leakage, unexplained restart, or post-release
error.

At inspection time, Railway workspace usage was USD 0.1372 and the estimated
period total was USD 0.1830. No workspace spending limit is configured; no
threshold was invented because the owner has not selected one.

## Open production blockers

The cutover is not complete and this evidence does not authorize marking the
implementation ready for review:

1. Railway rejects both the daily/weekly backup schedule and a named manual
   backup because the authenticated Trial/Hobby entitlement permits zero native
   volume backups; the sole workspace user is an administrator and list/API
   capability is present. Design Amendment 05 proposes reclassifying this from
   an operational backup blocker to an owner-accepted learning/pet-project risk.
   Healthy PITR, the successful PITR restore drill, provider-independent logical
   dump capability, the successful logical-dump restore drill, and production
   health remain mandatory. The HIGH-04 revision explicitly treats PITR as the
   only continuously maintained recovery copy and the deleted drill dump as
   capability evidence rather than retained redundancy. Native volume backups
   and scheduled encrypted off-project dumps become recommended future
   enhancements if the project moves to Pro, becomes production-critical, or
   holds data whose loss is no longer acceptable. The reclassification is not
   effective until immutable design review and explicit design approval.
2. The last known-good Pages commit/tag and actual GitHub push-trigger shutdown
   must be completed when the reviewed changes are committed/published. The
   repository workflow is already changed to manual-only, but an unpushed
   working-tree edit is not an external cutover.
Do not switch public links or declare Railway canonical until Amendment 05 is
approved, blocker 2 is resolved, its PITR/logical-dump release gates pass,
and smoke/monitoring checks are repeated against the final exact deployment.

The successful PITR and logical-dump restore drill below remains valid evidence
for the proposed mandatory recovery policy and is not repeated for this design
amendment. It does not itself approve Amendment 05 or resume
`production-cutover-operations`.

`railway.json` remains functional but Railway reports it deprecated after
2026-12-01. Migration to typed Railway IaC is a non-blocking follow-up that
needs a separately reviewed plan and explicit apply authorization.

## Restore drill

The drill used source PostgreSQL service
`82d4b5e1-830a-4467-bb1f-f9448fd1d58d` without changing its configuration or
application connection.

1. Railway restored the explicit point `2026-09-17T08:43:43Z` into new isolated
   service `postgres-restore-drill-20260917`
   (`3a5f5d76-7f2c-4a26-86a0-41c2511dc60a`). Deployment
   `f40b8f59-80b7-495b-9f93-ee09596172e9` reached `SUCCESS` with a separate
   restored volume.
2. The recovered point was correctly just before migration `001_baseline`; a
   read-only probe showed no application tables. Production held one migration
   and zero rows in each application table, so no user data was absent from that
   recovery point.
3. A provider-independent plain PostgreSQL dump was streamed from production to
   a permission-`0600` temporary file. It was 8,237 bytes with SHA-256
   `f55937d611c1568a3e7dc9ccb449e47e224b9fdeda4fa92228a0d60980232469`.
4. The dump was imported only into the isolated restore service with
   `ON_ERROR_STOP`. PostgreSQL recreated all six expected public tables,
   migration `001_baseline`, the approved foreign keys/check constraints, and
   the expected indexes.
5. Read-only verification showed the restored row counts exactly matched
   production: zero users, profiles, sessions, lesson-progress rows, and rate
   limits. The source web service and source database remained healthy and were
   never rewired.
6. The post-drill production smoke again passed health, readiness, API error,
   SPA, cache, and security-header checks; source web deployment
   `3c577338-f883-4b86-adbd-439fad684178` remained `SUCCESS`.
7. The temporary dump was securely removed after verification.

## Restore-drill cleanup

Before deletion, Railway read-back reconfirmed that the authorized target was
exactly PostgreSQL service `postgres-restore-drill-20260917`
(`3a5f5d76-7f2c-4a26-86a0-41c2511dc60a`), with successful deployment
`f40b8f59-80b7-495b-9f93-ee09596172e9` and restored volume
`postgres-1GMc-restored` (`4be20489-913c-4513-ba5c-e2b7af5229a9`). Production
web still referenced `${{Postgres-DOv_.DATABASE_URL}}`, and no non-target
service referenced the restore-drill name or ID.

After explicit owner approval, only that restore-drill service was deleted.
Railway subsequently reported:

- no service/config entry for `3a5f5d76-7f2c-4a26-86a0-41c2511dc60a`;
- no service instance or volume attached to that ID;
- only production web `4d0a3739-0beb-4ea9-9a7e-7a9f3494708e` and production
  PostgreSQL `82d4b5e1-830a-4467-bb1f-f9448fd1d58d` remain in production;
- production web deployment `3c577338-f883-4b86-adbd-439fad684178` remains
  `SUCCESS` and still references `${{Postgres-DOv_.DATABASE_URL}}`;
- the production HTTPS smoke again passed health, readiness, expected API 404,
  SPA, caching, and security-header checks;
- a direct production PostgreSQL query succeeded, found migration
  `001_baseline`, and confirmed the expected zero-user state;
- production PITR remains enabled and bucket-wired with a healthy archiver.

No production service, production database, DNS, GitHub Pages fallback, or
other Railway resource was modified or deleted during cleanup.
