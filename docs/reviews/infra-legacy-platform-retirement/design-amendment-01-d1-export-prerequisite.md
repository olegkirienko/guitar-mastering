# Design Amendment 01 — Remove the mandatory external D1 export prerequisite

## Amendment metadata

- **Work item:** `infra-legacy-platform-retirement`
- **Work-item type:** `infrastructure`
- **Authoritative design:**
  `docs/technical-designs/infra-legacy-platform-retirement.md`
- **Date:** 2026-09-17
- **Status:** `APPROVED`
- **Approval basis:** Explicit owner instruction that the legacy D1 database has
  no unique or unrecoverable data and that external export is no longer a
  prerequisite for retirement.

## Decision

The mandatory encrypted, provider-independent D1 export, checksum, storage
location, retention deadline, and eventual export-deletion record are removed
from the preconditions and deliverables of both implementation slices.

This amendment supersedes only those export-specific requirements. The first
slice must still use authenticated read-only queries to record the exact D1
identity, schema/migration inventory, aggregate row counts, Worker binding, and
dependency results. Any nonzero user, profile, session, or lesson-progress count
still blocks retirement and requires a separate data-retention decision.

## Safety boundary

The approved basis is that the D1 database is a disposable preview database and
contains no unique or unrecoverable data. This amendment does not authorize D1,
Worker, Pages, binding, secret, credential, or Railway deletion. Destructive
remote work still requires the dedicated
`authorize-destructive-live-legacy-resource-retirement` human gate bound to the
reviewed manifest digest and exact identities.

After D1 deletion there is no D1 data rollback artifact. Recovery is limited to
recreating the preview schema from Git history; the canonical application and
its durable data remain Railway Node/Express and Railway PostgreSQL.

