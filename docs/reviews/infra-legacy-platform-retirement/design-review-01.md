# Design Review 01 — Legacy deployment-platform retirement

## Review metadata

- **Work item:** `infra-legacy-platform-retirement`
- **Type:** `infrastructure`
- **Design artifact:** `docs/technical-designs/infra-legacy-platform-retirement.md`
- **Workflow phase reviewed:** `design_review`
- **Date:** 2026-09-16
- **Verdict:** `APPROVED`

## Scope reviewed

This review evaluates the proposed retirement of GitHub Pages, Cloudflare
Workers, Wrangler/D1 repository artifacts, Cloudflare preview resources, and
legacy credentials after the approved Railway Node/Express and PostgreSQL
migration. It assesses goal clarity, scope, correctness, security, operations,
recovery, deployment sequencing, validation, slice boundaries, and the
destructive-action gates.

It does not authorize implementation or remote deletion.

## Evidence assessed

- The tracked GitHub Pages workflow deploys `main` and the public Pages URL was
  live during design inventory.
- The committed Wrangler configuration identifies Worker
  `guitar-mastering-preview` and D1 database
  `c70af9e6-73e0-4baa-8023-af8679cba410`.
- Public Worker health and readiness probes both returned HTTP 200, proving the
  Worker and its persistence binding remain active.
- Railway preview has successful running web and PostgreSQL deployments, while
  the Railway production environment currently has no service instances.
- The working tree contains uncommitted Railway migration work, including
  pending deletion/replacement of several Worker/D1 artifacts.
- Wrangler is not authenticated in the current environment, so account-wide
  remote enumeration is correctly deferred to an authenticated,
  non-destructive preflight instead of being guessed.

## Assessment

### Goals, scope, and historical integrity

The design states an unambiguous target: one Railway Node/Express application
origin serving the SPA and `/api/v1`, with Railway PostgreSQL as the only active
persistence platform. Non-goals prevent feature work, D1-to-PostgreSQL data
migration by assumption, unrelated Cloudflare deletion, and rewriting immutable
history.

The artifact-by-artifact classification is sufficient and distinguishes active
operator documentation from immutable designs, reviews, workflows, and Git
history. It correctly keeps the transitive `pg-cloudflare` package because that
package is part of the retained PostgreSQL client rather than a Worker runtime
dependency. It also makes a definite defensive decision to retain the
`.wrangler/` ignore while deleting generated local state.

### Architecture and implementation feasibility

The target topology matches the approved Railway architecture. The repository
slice removes the dual-target build/configuration path and requires positive
tests for root SPA serving and `/api/v1`, rather than relying only on searches
for removed names.

The design explicitly handles overlap with the open
`feature-auth-persistence` workflow. That workflow retains ownership until it
either completes the overlapping work or approves an amendment delegating it.
The production-readiness milestone is separated from Pages shutdown, avoiding
a circular dependency between the two work items.

Two slices are appropriate:

1. repository cleanup plus authenticated, non-destructive retirement preflight;
2. exact live-resource retirement and verification.

The first slice produces and freezes the approval manifest before the standard
`next_slice_approval` gate. This makes the destructive approval concrete and
auditable. The final-slice rule is explicit.

### Security and privacy

The design prohibits committing credentials, secret values, exported data, or
raw user records. It inventories secret names and ownership only, requires an
encrypted external D1 export with checksum and retention deadline, and treats
any unexpected durable data as a stop condition. Shared credentials and
unrelated Cloudflare resources are fail-closed rather than deleted by naming
heuristic.

The approval is bound to exact resource identities, repository state, and the
manifest SHA-256 digest. Identity or manifest drift invalidates approval. This
is stronger than a generic “clean up Cloudflare” authorization and satisfies
the explicit-approval requirement.

### Deployment, recovery, and operations

The design correctly recognizes that the replacement preview is not a
production cutover. Repository deployment-path removal requires healthy
Railway production and an ownership handoff. Destructive cleanup additionally
requires production health, backup/restore evidence, acceptance checks, an
elapsed rollback window, authenticated inventories, an encrypted export, and
the dedicated human gate.

Deletion order is safe: freeze recreation paths, observe drain, disable Pages,
delete the exact Worker without force, re-check dependencies, delete the exact
D1 database, then revoke only dedicated credentials. Authenticated read-back
and public endpoint checks are required after deletion. The design accurately
notes that remote rollback becomes asymmetric after Worker/D1 deletion and
records a last-known-good Pages restoration path before that point.

Failure modes cover absent production, worktree collision, unexpected
resources/data, Worker dependencies, residual traffic, partial deletion,
ambiguous credential ownership, and stale legacy URLs.

### Validation strategy

Repository validation covers lint, unit/acceptance tests, PostgreSQL integration
tests, the Railway build, diff hygiene, negative legacy-reference checks, CI
inspection, and positive frontend/API server behavior. Remote validation
requires provider read-back plus Railway health/auth/persistence smoke checks;
delete-command exit status alone is explicitly insufficient.

### Unnecessary abstraction

No new runtime abstraction or dependency is introduced. The design removes the
obsolete multi-target deployment abstraction and uses documentation artifacts
only where they provide durable operational evidence.

## Findings

No actionable findings were identified.

## Verdict and gate recommendation

**Verdict: `APPROVED`**

Open the standard `design_approval` human gate. Approval authorizes only the
first slice, `repository-cleanup-and-retirement-preflight`, and only after its
documented production-readiness and cross-work-item ownership preconditions
pass. It does not authorize disabling GitHub Pages, deleting the Worker or D1,
or revoking secrets/tokens.

The destructive final slice requires a later `next_slice_approval` whose action
is `authorize-destructive-live-legacy-resource-retirement` and whose approval
is bound to the reviewed manifest digest and exact remote identities.

