# Implementation Review 14 — Production cutover and operations

## Review metadata

- **Work item:** `feature-auth-persistence`
- **Work-item type:** `technical_feature`
- **Authoritative design:** `docs/technical-designs/feature-auth-persistence.md`
- **Approved amendment:** `docs/reviews/feature-auth-persistence/design-amendment-05-production-backup-policy.md`
- **Latest design review:** `docs/reviews/feature-auth-persistence/design-review-09.md`
- **Workflow state:** `docs/workflow/feature-auth-persistence.yaml`
- **Slice reviewed:** `production-cutover-operations`
- **Current HEAD SHA:** `0d755047f1f43cdadbdabcc78321918b23b7d45f`
- **Deployed implementation SHA:** `67be1d6238dacfdb2e0f108839d63b64cc38e708`
- **Date:** 2026-09-17
- **Verdict:** `APPROVED`

## Preflight

The workflow state is consistent and authorizes this review. It identifies the
work item and technical-feature type, references the approved design and all
approved amendments, uses canonical `phase: implementation_review` with a
matching `next.phase`, has no open gate or blocking findings, and marks
`production-cutover-operations` implemented. Design Review 09 is the compatible
latest review for the revised production backup policy. The authoritative
design defines this as the final approved slice, so an approval must route to
`human_gate / work_item_completion`; no later slice may be invented.

The unrelated untracked `infra-legacy-platform-retirement` design, review, and
workflow artifacts were not modified or assessed as part of this slice.

## Review scope

This review covers the final slice's Railway configuration and production
deployment, blocking migrations and readiness, security headers, production
smoke, monitoring and cost evidence, privacy and retention wording, PITR and
logical-export recovery evidence, canonical-origin cutover, and manual-only
Pages fallback workflow. Earlier authentication, profile, progress, and lesson
adapter behavior was checked only for regression through the full validation
matrix.

## Findings

No actionable blocking findings were identified.

## Design and implementation assessment

- **Deployment and migration safety:** `railway.json` builds the Railway target,
  runs checked-in migrations as a blocking pre-deploy command, starts the Node
  service, gates traffic on database readiness, limits restarts, and matches the
  live one-replica, non-sleeping service manifest. The active deployment is
  `SUCCESS` and reports the exact reviewed implementation SHA.
- **Security and privacy:** production fails closed on HTTPS origin, secure
  cookies, trusted proxy configuration, private PostgreSQL, and a sufficiently
  long rate-limit HMAC key. The redacted production-variable read confirms
  those conditions without exposing secrets. The database has no public TCP
  proxy. HSTS, CSP report-only, permissions, referrer, `nosniff`, and cache
  controls are implemented and pass the live smoke. Privacy wording accurately
  distinguishes active rows, browser-local caches, PITR retention, and
  temporary approved logical exports.
- **Persistence and recovery:** the live PostgreSQL service and its attached
  production volume are healthy. PITR is enabled, bucket-wired, exposes one
  backup set, and reports a healthy archiver. The durable evidence records the
  isolated PITR restore and provider-independent logical-dump reconstruction,
  matching schema, constraints, indexes, migrations, and row counts, plus
  deletion of the temporary dump. It accurately states that PITR is the only
  continuously maintained recovery copy under the explicitly approved
  pet-project risk posture.
- **Cutover and rollback:** the annotated
  `pages-fallback-2026-09-17` tag is published and resolves to the recorded
  last-known-good Pages commit. The Pages workflow is manual-only, so pushes no
  longer replace the fallback artifact. The Railway domain is active, the
  production smoke passes, and the operations record identifies Railway as the
  canonical origin while retaining the tagged guest-only Pages rollback path.
- **Observability and resource posture:** structured logs show successful no-op
  migrations, startup, readiness, route templates, outcomes, and the correct
  deployment version without secret material. The latest one-hour metrics show
  ten requests, zero 5xx responses, zero HTTP error rate, maximum CPU about
  `0.0531 vCPU`, and maximum memory about `150.1 MB` of a roughly `1 GB` limit.
  No saturation, unexplained restart, or database failure is present.
- **Scope discipline and maintainability:** the implementation stays within the
  final slice's infrastructure, recovery, headers, smoke, monitoring/privacy,
  cost, canonical-origin, and Pages-shutdown ownership. The noted future move
  from deprecated `railway.json` to typed Railway IaC is explicitly
  non-blocking and belongs to a separately reviewed work item.
- **Regression safety:** unit/service, PostgreSQL integration, and Chrome
  browser tests pass, including authentication, session, profile, progress,
  local-first/offline behavior, cache isolation, accessibility, and deployment
  target boundaries.

## Validation

Authoritative local validation used Node `24.7.0` and passed:

- `pnpm lint`;
- `pnpm test` — 13 files passed, 3 PostgreSQL-gated files skipped, 62 tests
  passed, 19 skipped;
- `pnpm test:postgres` — 3 files and 19 tests passed;
- `pnpm test:browser` — Chrome, 10 tests passed;
- `pnpm build:pages`;
- `pnpm build:railway`;
- `git diff --check`.

The first sandboxed `pnpm test` attempt could not bind loopback sockets and
failed with `listen EPERM`; the identical suite was rerun outside that sandbox
restriction and produced the passing result above.

Fresh read-only production verification passed:

- deployment `11a3dc0e-0092-4b61-8643-61cb30da5e3a` is `SUCCESS` with one
  running replica and reviewed SHA `67be1d6238dacfdb2e0f108839d63b64cc38e708`;
- web and PostgreSQL services are `SUCCESS`;
- the canonical Railway service domain is `ACTIVE`;
- PostgreSQL has no public TCP proxy;
- PITR is enabled, bucket-wired, available, and archiver-healthy;
- redacted production configuration checks pass;
- `pnpm smoke:production -- https://guitar-mastering-web-production-production.up.railway.app`
  passes health, readiness, unknown-API, SPA, caching, and security-header checks;
- the latest one-hour metrics contain no 5xx responses or resource saturation;
- the published fallback tag resolves to commit
  `8c502ac4c5894d2fbec4496446794e6edd497f2a`.

## Verdict and transition

**Verdict: `APPROVED`**

`production-cutover-operations` is the final approved slice. Transition to
`human_gate / work_item_completion`. The work item must not enter `complete`
until the owner explicitly approves that final completion gate.

## Exact verdict

APPROVED
