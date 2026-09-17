# Design Amendment 05 — Production backup policy

## Amendment metadata

- **Work item:** `feature-auth-persistence`
- **Work-item type:** `technical_feature`
- **Authoritative design:** `docs/technical-designs/feature-auth-persistence.md`
- **Affected slice:** `production-cutover-operations`
- **Date:** 2026-09-17
- **Status:** `REVISED — READY FOR DESIGN REVIEW`
- **Revision:** `HIGH-04 logical-dump recovery posture`
- **Next review identifier:** `design-review-09`
- **Supersedes assumption:** Production cutover requires native scheduled
  Railway volume backups in addition to PITR and provider-independent logical
  dumps.

This revised proposal is limited to the production backup policy. Design Review
08 remains the immutable record of the original proposal's `HIGH-04` finding.
This revision does not modify application code, the Railway plan, production
data, or production infrastructure.

## Trigger and established facts

The authenticated Railway investigation established that native manual and
scheduled volume backups are unavailable under the current Trial/Hobby
entitlement and require Railway Pro. The sole workspace member is an
administrator, backup/schedule listing works, and Railway exposes the relevant
manual and daily/weekly/monthly APIs. The denial is therefore a plan constraint,
not a missing permission, token, or API capability.

Existing production evidence already establishes all of the following:

- Railway PostgreSQL PITR is enabled and healthy;
- the PITR restore drill succeeded in an isolated target;
- a provider-independent logical dump can be created;
- the logical-dump restore drill succeeded in an isolated target; and
- production PostgreSQL and application readiness remained healthy after the
  recovery drill.

This amendment accepts those records as evidence. It does not repeat or reopen
the completed drills.

## Decision

For this learning/pet project, production cutover requires:

1. Railway PostgreSQL PITR enabled and healthy;
2. a successful PITR restore drill;
3. provider-independent logical dump capability;
4. a successful logical-dump restore drill; and
5. production readiness and health verification.

Railway native scheduled or manual volume backups are not mandatory for this
project's production cutover.

PITR is the only continuously maintained recovery copy. Logical dumps are a
verified on-demand export and portability mechanism; the completed drill's
temporary dump was securely deleted and is not a retained second recovery
layer. Production cutover does not require a scheduled or retained logical dump.

Native Railway volume backups and scheduled retained logical dumps remain
recommended future enhancements if the project moves to Railway Pro, becomes
production-critical, or begins holding data whose loss the owner no longer
accepts. They do not replace PITR.

## Accepted tradeoff

The owner explicitly accepts the additional recovery risk because this is a
learning/pet project rather than a production-critical service.

Without native volume backups or retained logical dumps, there is no
Railway-managed scheduled snapshot history, native volume-restore path, or
portable current copy in addition to PITR. Recovery inside the available
archive window depends on healthy PITR. The completed logical-dump drill proves
export and reconstruction capability only; it does not provide recoverable
data after its temporary artifact is deleted.

If the Railway project, PITR bucket, or usable archive is lost before a fresh
logical export is made, current server data may be unrecoverable. There is no
promised recovery point outside the actual PITR window. This is materially less
resilient than a maintained two- or three-layer policy.

That risk is accepted only in the current project context. A future move to
Railway Pro, a change to production-critical status, or a change in acceptable
data loss must reopen the policy. The replacement policy should add native
manual/scheduled volume backups and a scheduled encrypted logical dump outside
the Railway project failure boundary, with explicit freshness/RPO, retention,
access, failure monitoring, and recurring restore-verification requirements.

## Recovery boundary

- For recent corruption inside the usable PITR window, restore into a new
  isolated PostgreSQL service, verify it, and use a separately reviewed action
  for any production connection change.
- If PITR is unavailable and no retained dump exists, recovery cannot be
  promised. If portable reconstruction is needed while production is reachable,
  create a fresh logical dump under an explicitly approved operation, restore it
  into compatible PostgreSQL, and verify the schema, migrations, constraints,
  indexes, and expected row counts.
- Never restore over, delete, or automatically rewire the source production
  database as part of backup recovery.

PITR coverage starts only after the first base backup, is limited to its actual
archive window, depends on an asynchronous archiver and Railway bucket, and can
truncate after archive interruption. An approved logical export uses a
permission-`0600` temporary artifact, keeps credentials and contents out of
logs, and securely removes the artifact after its approved use. Retaining or
scheduling dumps is prohibited until a separately reviewed policy defines
freshness/RPO, encryption, access, storage failure domain, retention, failure
monitoring, and restore-drill cadence. These limitations are part of the
accepted risk.

## Cutover and workflow disposition

After this amendment passes immutable design review and receives explicit human
approval, native Railway volume backups cease to be a production-cutover
blocker. Cutover may then proceed when the five mandatory recovery/readiness
requirements above and every other release gate are satisfied.

Until that review and approval complete, `production-cutover-operations`
remains paused. This amendment does not itself resume implementation.

## Design-review scope

Design Review 09 must verify that `HIGH-04` is resolved: PITR is unambiguously
the only continuously maintained recovery copy; logical dumps are described as
verified on-demand capability rather than a retained layer; the owner accepts
loss outside the actual PITR window and loss after a shared Railway project/
bucket failure; temporary-export security and deletion are explicit; future
policy-reopen triggers and required lifecycle controls are complete; the
existing verified drill remains valid rather than being rerun; and the paused
slice cannot resume before explicit approval.

## Sources

- Railway volume backups: <https://docs.railway.com/volumes/backups>
- Railway point-in-time recovery:
  <https://docs.railway.com/volumes/point-in-time-recovery>
- Railway PostgreSQL backup and restore guide:
  <https://docs.railway.com/guides/postgres-backups-restores>
- Railway plans: <https://docs.railway.com/pricing/plans>
