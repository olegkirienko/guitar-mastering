# Design Review 09 — Production backup policy revision

## Review metadata

- **Work item:** `feature-auth-persistence`
- **Work-item type:** `technical_feature`
- **Authoritative design:** `docs/technical-designs/feature-auth-persistence.md`
- **Amendment reviewed:** `docs/reviews/feature-auth-persistence/design-amendment-05-production-backup-policy.md`
- **Prior review:** `docs/reviews/feature-auth-persistence/design-review-08.md`
- **Affected slice:** `production-cutover-operations`
- **Workflow phase reviewed:** `design_review`
- **Current HEAD SHA:** `8c502ac4c5894d2fbec4496446794e6edd497f2a`
- **Date:** 2026-09-17
- **Verdict:** `APPROVED`

## Preflight

The workflow state is consistent and authorizes this review. It identifies the
work item and technical-feature type, references the existing authoritative
design and revised Amendment 05, uses canonical `phase: design_review` with
matching `next.phase`, has no open gate or blocking findings, and keeps the
affected `production-cutover-operations` slice paused. Design Review 08 exists
as the compatible prior immutable review with verdict `CHANGES REQUIRED`. The
authoritative design still defines `production-cutover-operations` as the final
approved slice; this revision does not add, reorder, or enlarge implementation
slice ownership.

## Scope of review

This review verifies the `HIGH-04` revision and checks the surrounding backup,
recovery, privacy, validation, and workflow contracts for direct
contradictions. It does not reopen the completed recovery drill, re-review
earlier feature slices, authorize implementation, or change Railway resources.

## Finding resolution

### HIGH-04 — RESOLVED

The revised design no longer calls logical-dump capability plus a deleted drill
artifact a maintained recovery layer. It states unambiguously that Railway PITR
is the only continuously maintained recovery copy and that the completed
logical-dump drill proves only on-demand export and reconstruction capability.
The authoritative design, amendment, runbook, release gate, evidence record,
privacy notice, and definition of done use the same posture.

The accepted loss boundary is now explicit. No scheduled or retained logical
dump, off-project copy, or recovery point outside the actual PITR window is
promised. If the Railway project, PITR bucket, or usable archive is lost before
a fresh export, current server data may be unrecoverable. This is materially
weaker than Railway's recommended multi-layer production posture, but it is no
longer overstated and is proportionate to the owner's stated learning/pet-
project context, subject to the explicit design-approval gate.

Temporary export handling is deterministic. An approved portability operation
uses a permission-`0600` artifact, excludes credentials and contents from logs,
restores only into an isolated verification target, and securely removes the
artifact after its approved use. Retained or scheduled dumps are prohibited
until a separately reviewed policy defines freshness/RPO, encryption, access,
storage failure domain, retention, failure monitoring, and restore-drill
cadence. Recovery never overwrites, deletes, or automatically rewires the
production source.

The policy also defines objective reopening triggers: Railway Pro,
production-critical use, or data whose loss is no longer acceptable. That
future policy must add native manual/scheduled volume backups and a scheduled,
encrypted, access-restricted logical dump outside the Railway project failure
boundary while retaining PITR. The completed PITR and logical-dump drill remains
valid mechanism evidence and need not be repeated merely to approve this
wording revision.

## Design assessment

- **Goal clarity and scope:** The amendment identifies the exact superseded
  cutover assumption, affected final slice, mandatory gates, non-mandatory
  controls, and accepted loss boundary. It remains limited to backup policy.
- **Architecture and correctness:** PITR's asynchronous archive, actual-window,
  shared Railway control-plane, and isolated-restore boundaries are represented
  accurately. Logical export is correctly separated from a retained backup.
- **Security and privacy:** Temporary dumps have minimum file permissions,
  redaction, isolated-use, and deletion rules. The privacy notice now describes
  PITR retention and temporary exports without claiming a nonexistent logical-
  backup retention schedule.
- **Implementation feasibility:** The selected posture requires no new backup
  service or storage system. The final slice needs only to verify the existing
  PITR, drill, health, and release gates before completing the remaining
  canonical cutover work.
- **Validation and operations:** The cutover checklist can objectively verify
  PITR health, the recorded isolated drills, temporary-dump deletion, absence of
  falsely represented retained backups, production health, and final smoke/
  monitoring results. Existing evidence is preserved rather than rerun.
- **Deployment and rollback:** PITR restoration remains a new sibling service;
  application/database connection changes remain separately reviewed. The
  guest-only Pages fallback and device-local progress remain available for
  application or Railway outages but are not misrepresented as database
  recovery.
- **Slice boundaries and abstraction:** All remaining work belongs to the
  existing final `production-cutover-operations` slice. No new abstraction,
  scheduled job, object store, or implementation slice is introduced.
- **Gate discipline:** The slice remains paused. This review approves the
  design only; explicit owner approval is still required before implementation
  resumes under the reduced recovery posture.

No actionable blocking findings remain.

## Sources verified

- Railway PostgreSQL backup/restore layers, logical export, recurring dump, and
  restore-drill guidance:
  <https://docs.railway.com/guides/postgres-backups-restores>
- Railway PITR archive-window, asynchronous WAL, and isolated-restore behavior:
  <https://docs.railway.com/volumes/point-in-time-recovery>
- Railway native volume-backup behavior and retention:
  <https://docs.railway.com/volumes/backups>
- Railway plan boundaries: <https://docs.railway.com/pricing/plans>

Railway's guidance recommends all three protection mechanisms for production.
The reviewed design consciously accepts less protection for this pet project
and now describes that divergence and its consequences without ambiguity.

## Verdict and gate recommendation

**Verdict: `APPROVED`**

Open a `design_approval` human gate. Keep
`production-cutover-operations` paused until the owner explicitly approves the
revised PITR-only continuously maintained recovery posture. After approval, the
legal action is to resume that same final slice; no new implementation slice is
created.

## Exact verdict

APPROVED
