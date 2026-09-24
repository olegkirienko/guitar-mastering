# Railway production operations and rollback

## Fixed production topology

- Railway project: `guitar-mastering` (`112644ba-cb91-443b-ae4b-73a0d6f74b69`).
- Environment: `production` (`994fd373-dd1d-4073-8b7f-116e77d898fa`).
- Web service: `guitar-mastering-web-production`
  (`4d0a3739-0beb-4ea9-9a7e-7a9f3494708e`).
- PostgreSQL service: `Postgres-DOv_`
  (`82d4b5e1-830a-4467-bb1f-f9448fd1d58d`).
- Canonical candidate origin:
  `https://guitar-mastering-web-production-production.up.railway.app`.
- One persistent Node web instance and one private PostgreSQL instance.
- The browser reaches only the HTTPS web origin. `DATABASE_URL` references the
  PostgreSQL service's private URL; production must not have a database TCP
  proxy.
- One web replica in one region is the accepted MVP availability boundary.

## Production backup policy

For this learning/pet project, production cutover requires healthy PostgreSQL
PITR, a successful isolated PITR restore drill, provider-independent logical
export capability, a successful isolated logical-dump restore drill, and healthy
production verification after recovery testing.

Railway native scheduled/manual volume backups are unavailable on Trial/Hobby
and require Pro. They are not mandatory for this cutover. PITR is the only
continuously maintained recovery copy; the logical-dump drill proves on-demand
portability but its temporary artifact was deleted and is not a retained backup.
The owner accepts that data outside the usable PITR window, or data lost with the
Railway project/bucket before a fresh export, may be unrecoverable. Native volume
backups and scheduled encrypted off-project logical dumps remain recommended if
the project moves to Pro, becomes production-critical, or holds data whose loss
is no longer acceptable. This policy becomes effective only after Design
Amendment 05 passes review and explicit approval.

## Release gate

1. Pass `pnpm lint`, `pnpm test`, `pnpm test:postgres`, `pnpm test:browser`,
   `pnpm build`, and `git diff --check` on Node
   `24.7.x`.
2. Confirm production variables match `.env.example`, use `APP_ENV=production`,
   `NODE_ENV=production`, secure cookies, an HTTPS `PUBLIC_ORIGIN`, a private
   PostgreSQL reference, and a secret HMAC key of at least 32 bytes.
3. Confirm the PostgreSQL service has no public TCP proxy. Verify PITR is
   enabled, bucket-wired, and archiver-healthy. Confirm the recorded isolated
   PITR restore drill succeeded.
4. Confirm provider-independent logical export capability and the recorded
   isolated logical-dump restore drill, including migrations, tables,
   constraints, indexes, and row counts. Do not repeat already verified drills
   solely for this amendment. Confirm that the temporary drill dump was removed
   and that no retained/scheduled dump is being represented as a current backup.
   Never restore over or rewire the source automatically.
5. Correlate the release to one full Git commit SHA. Until the separately
   reviewed GitHub source/autodeploy slice is approved and activated, deploy
   the exact reviewed repository through the existing manual path and retain
   `DEPLOYMENT_VERSION` as its static fallback. After activation, require the
   actual `push`-event `Validate` run for that exact `main` SHA and follow the
   ordered controls in the [Railway CI/CD runbook](railway-ci-cd.md). A manual
   workflow run is never release evidence.
6. Observe Railway `SUCCESS`, correlate Railway deployment metadata with the
   structured `server_started` and `request_completed` log
   `deploymentVersion`, and run
   `pnpm smoke:production -- https://<production-origin>`. GitHub-triggered
   deployments must log `RAILWAY_GIT_COMMIT_SHA`; current manual deployments
   use the preserved `DEPLOYMENT_VERSION` fallback. Do not remove the fallback
   until end-to-end acceptance proves Git metadata in production.
7. Inspect application logs plus HTTP, CPU, memory, network, and volume metrics.
   Any leak, unexplained restart/5xx, database failure, saturation, or failed
   migration blocks cutover.
8. Confirm the Railway origin remains canonical and no active release workflow
   targets a retired platform.

## Rollback

- Application regression: select the prior migration-compatible Railway
  deployment. Do not roll schema backward; migrations use expand/migrate/
  contract compatibility.
- Railway outage: restore a prior compatible Railway deployment or recover into
  an isolated Railway service before a separately reviewed traffic change.
- Database corruption: leave the source untouched and use PITR to create a new
  PostgreSQL service. If production remains reachable and a portable rebuild is
  required, create a fresh approved logical export and restore it to a new
  target. Verify the target and change `DATABASE_URL` only in a separately
  reviewed recovery action.
- Client state is never cleared as part of rollback. Guest learning and valid
  device-local progress remain available.
- Record the failed and restored Railway deployment IDs and their full source
  SHAs. Confirm the restored structured-log `deploymentVersion` matches the
  selected migration-compatible deployment before closing the incident.

## Recovery boundary

Use PITR into a new sibling service for incidents inside its usable archive
window. PITR coverage is not retroactive, can truncate after archiver failure,
and depends on Railway's bucket/control plane. There is no retained logical dump
or promised recovery point outside that window. When production is reachable,
an explicitly approved portability operation may create a fresh permission-
`0600` logical dump, keep credentials and contents out of logs, restore into an
isolated target, and securely remove the temporary artifact afterward. A
scheduled or retained dump requires a separately reviewed lifecycle policy.
Verify any isolated target before a separately reviewed production connection
change.

## Monitoring and incident checks

Review Railway logs and metrics after every deploy and at least weekly while the
service is low traffic. Alert/investigate on sustained 5xx, readiness failures,
database/pool latency, `AUTH_BUSY`/`AUTH_UNAVAILABLE`, abnormal 401/409/429
trends, restarts, CPU/memory/disk saturation, failed migrations, unhealthy PITR,
or failed recovery verification. Structured logs are the initial application latency/error view;
OpenTelemetry is deferred until this view proves insufficient.

During an incident, preserve request/deployment IDs and coarse outcomes. Never
copy passwords, cookies, session tokens, hashes, salts, names, raw IPs, full
bodies, or database URLs into tickets or logs.

## Cost controls

Record current and estimated Railway usage at cutover and review it after the
first production week before resizing. Configure workspace usage notifications
and a hard limit only when the owner has selected explicit dollar thresholds;
hard limits can interrupt the service. Keep serverless sleep disabled for the
production web/database path because wake latency and transient 502 responses
are outside the production contract.
