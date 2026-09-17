# Design Review 08 — Production backup policy

## Review metadata

- **Work item:** `feature-auth-persistence`
- **Work-item type:** `technical_feature`
- **Authoritative design:** `docs/technical-designs/feature-auth-persistence.md`
- **Amendment reviewed:** `docs/reviews/feature-auth-persistence/design-amendment-05-production-backup-policy.md`
- **Prior approved review:** `docs/reviews/feature-auth-persistence/design-review-07.md`
- **Affected slice:** `production-cutover-operations`
- **Workflow phase reviewed:** `design_review`
- **Current HEAD SHA:** `8c502ac4c5894d2fbec4496446794e6edd497f2a`
- **Date:** 2026-09-17
- **Verdict:** `CHANGES REQUIRED`

## Preflight

The workflow state is consistent and authorizes this review. It identifies the
work item and technical-feature type, references the existing authoritative
design and Amendment 05, uses canonical `phase: design_review` with matching
`next.phase`, has no open gate or blocking findings, and keeps the affected
`production-cutover-operations` slice paused. The latest review exists and is
compatible with the recorded approved predecessor slice. The authoritative
design contains `production-cutover-operations` as the final approved slice, so
the amendment does not invent or reorder implementation work.

## Scope of review

This review is limited to Amendment 05's production backup-policy change. It
assesses the mandatory recovery layers, accepted learning/pet-project risk,
PITR and logical-dump boundaries, existing restore evidence, implementation
feasibility, operational ownership, validation, and the requirement for a new
explicit approval before the paused final slice resumes. It does not reopen the
completed restore drill or the approved behavior of earlier slices.

## Summary

The amendment correctly distinguishes Railway PITR, native volume backups, and
provider-independent logical dumps. It makes the owner's project-specific risk
acceptance explicit, accurately limits PITR to its real archive window and
asynchronous archiver health, restores only into an isolated target, and keeps
native backups as a recommended future Pro or production-critical enhancement.
It also preserves the prior recovery drill rather than requiring a destructive
or wasteful repetition merely for this design review.

The amendment is not ready for approval because it describes PITR and logical
dumps as two verified recovery layers while requiring only the ability to make
a logical dump and one historical restore drill. The drill's dump was deleted,
and neither the amendment nor the cutover gate requires a retained, sufficiently
fresh logical dump or any ongoing dump schedule. Once production accepts user
data, a capability test is not a recoverable copy. The stated two-layer posture
therefore collapses to Railway-hosted PITR until an operator happens to create
and preserve another dump.

## Blocking finding

### HIGH-04 — The logical-dump “layer” has no durable artifact or freshness contract

**Evidence**

- The mandatory policy requires logical-dump capability and a successful past
  restore drill, but it does not require a retained dump at cutover or after
  production begins.
- The recorded drill securely deleted its temporary dump after verification.
  That was correct handling for a temporary credential-bearing artifact, but it
  means the drill itself supplies no recoverable provider-independent copy.
- The amendment says a logical dump contains only the state captured when it was
  created, yet defines no cadence, maximum acceptable age or recovery-point
  objective, retention period, durable storage location, encryption/access
  boundary, success monitoring, or recurring restore-verification cadence.
- Railway's current PostgreSQL recovery guidance treats logical dumps as the
  operator-controlled portable/offsite layer, recommends automating them on a
  schedule, and says to repeat restore drills on a schedule. The same guidance
  notes that logical dumps are the layer that can survive project deletion.
- PITR and a Railway-hosted dump stored only inside the same project would still
  share a project/control-plane failure boundary. The present design does not
  state whether the portable copy must cross that boundary.

**Impact**

After cutover, project deletion, archive-bucket loss, an unnoticed PITR gap, or
another Railway control-plane failure could leave no provider-independent copy
of current user/profile/progress data. Even without a platform-wide event, an
old ad hoc dump can silently imply an unbounded recovery point and unexpected
data loss. Calling capability plus a deleted drill artifact a second recovery
layer overstates the approved resilience and makes the release gate impossible
to audit objectively.

**Required revision**

Define the intended logical-dump posture explicitly and make its tradeoff
auditable:

1. If logical dumps remain a mandatory second recovery layer, require a retained
   successful dump whose age is within a stated project-appropriate recovery
   point at cutover, then define an ongoing creation cadence, retention policy,
   durable storage and trust boundary, encryption/access handling, failure
   monitoring, and a proportionate recurring restore-verification cadence.
   State whether the durable copy must survive deletion of the Railway project;
   if it need not, explicitly accept that shared-failure risk rather than calling
   it provider-independent/offsite protection.
2. If the owner intends to accept PITR as the only continuously maintained copy
   and retain logical dumps only as an on-demand export capability, say so
   directly, remove the “two verified recovery layers” claim, and explicitly
   accept the resulting recovery-point and project-loss risk.

In either case, update the authoritative design, Amendment 05, production
runbook, cutover checklist, privacy/retention wording where applicable, and
validation evidence requirements together. Preserve the completed drill as
proof that the mechanism works; do not repeat it solely to revise the policy.

## Assessment

- **Goal clarity and scope:** The trigger, superseded assumption, affected final
  slice, and owner-specific risk acceptance are clear. The amendment remains
  appropriately limited to backup policy.
- **Architecture and recovery correctness:** PITR's archive window, asynchronous
  failure mode, isolated restore behavior, and manual cutover boundary are
  accurately represented. `HIGH-04` is the blocking gap between demonstrated
  export capability and an actually maintained second recovery layer.
- **Security and privacy:** The new target must keep dumps access-restricted and
  avoid leaking database credentials or user data. A durable-copy decision also
  needs a defined deletion/retention boundary so the privacy notice remains
  truthful.
- **Implementation feasibility:** A small scheduled dump job and encrypted
  object storage are technically conventional, but the amendment must decide
  ownership, storage boundary, and lifecycle before implementation resumes. A
  consciously accepted PITR-only posture is also implementable if described
  without overstating redundancy.
- **Validation strategy:** Reusing the successful isolated PITR and logical-dump
  restore drill is sound. The revised policy needs an objective freshness check
  for any retained dump and a way to detect failed scheduled exports if it
  chooses the maintained two-layer option.
- **Slice boundaries and abstraction:** The revision belongs within the existing
  final `production-cutover-operations` slice. No new slice, backup framework,
  or unrelated application change is warranted.
- **Gate discipline:** The slice is correctly paused. No implementation may
  resume until the revision passes a new immutable design review and the owner
  explicitly approves the resulting `design_approval` gate.

## What should remain unchanged

- Keep PITR enabled and health-checked, with restore into a separate service.
- Preserve the completed PITR and logical-dump restore drill as valid mechanism
  evidence rather than rerunning it merely for this amendment.
- Keep native Railway volume backups non-mandatory for this learning/pet project
  and recommended for a future Pro or production-critical posture.
- Keep recovery actions from overwriting, deleting, or automatically rewiring
  the production source.
- Keep the final slice paused until review and explicit human approval complete.

## Sources verified

- Railway PostgreSQL backup/restore layers, scheduled logical dumps, and restore
  drill guidance: <https://docs.railway.com/guides/postgres-backups-restores>
- Railway PITR archive, retention, async-WAL, and isolated-restore behavior:
  <https://docs.railway.com/volumes/point-in-time-recovery>
- Railway native volume-backup behavior and retention:
  <https://docs.railway.com/volumes/backups>
- Railway plan boundaries: <https://docs.railway.com/pricing/plans>

Authenticated read-only Railway CLI preflight on 2026-09-17 also confirmed the
linked project, production web and PostgreSQL services, and current successful
production deployments. No infrastructure mutation was performed for this
review.

## Verdict and transition

**Verdict: `CHANGES REQUIRED`**

Do not open a `design_approval` gate and do not resume
`production-cutover-operations`. Return to `phase: design` with `HIGH-04`
active. Revise the backup policy to define an actual maintained logical-dump
layer or explicitly accept and name a PITR-only continuous-recovery posture,
then submit the revision for a new immutable design review.

## Exact verdict

CHANGES REQUIRED
