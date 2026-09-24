# Design Amendment 03 — Production web-service identity correction

**Work item:** `railway-ci-cd-iac` (`infrastructure`)

**Current slice:** `railway-github-autodeploy`

**Authoritative design:** `docs/technical-designs/railway-ci-cd-iac.md`

**Date:** 2026-09-24

**Status:** approved by Design Review 13; `LOW-01` resolved; awaiting explicit `design_approval`

## Evidence and reason

The approved bootstrap operator plan and current CI/CD runbook recorded the
production web service as `4d0a3739-0beb-4ea9-9a7f3494708e`. That value is a
truncated, nonexistent identity. The authoritative design's topology baseline
already records the full identity
`4d0a3739-0beb-4ea9-9a7e-7a9f3494708e`, consistent with the earlier IaC
handoff, retirement record, and current Railway state.

A fresh read-only Railway CLI 5.57.7 query on 2026-09-24 confirmed:

- project `112644ba-cb91-443b-ae4b-73a0d6f74b69` contains production
  environment `994fd373-dd1d-4073-8b7f-116e77d898fa`;
- web service `4d0a3739-0beb-4ea9-9a7e-7a9f3494708e` is named
  `guitar-mastering-web-production` in that environment;
- its existing domain is
  `guitar-mastering-web-production-production.up.railway.app`, domain ID
  `1cff255c-4eea-493e-9c82-7d2ba1672046`;
- its current deployment `e0e98aab-e244-4151-8622-3e88a6d4f9ed` is
  `SUCCESS`, is not stopped, and has a running instance;
- PostgreSQL service `82d4b5e1-830a-4467-bb1f-f9448fd1d58d` remains in the
  same production environment with successful deployment
  `4187bbb4-bc5d-44fb-92da-b40e68022e01` and a running instance;
- the web service source remains unset (`repo: null`, `image: null`); and
- volume `4495ab33-2440-4d29-a4d4-e214813676a8` remains `READY`, while PITR
  bucket `06fb8382-c35f-43be-b127-3fb98c30f3b0` remains present.

The preflight that found the mismatch performed no remote mutation. The
pending bootstrap approval was not consumed.

## Narrow design correction

1. Replace only the truncated web-service identity in
   `docs/operations/railway-github-autodeploy-plan.md` and
   `docs/operations/railway-ci-cd.md` with the verified full identity
   `4d0a3739-0beb-4ea9-9a7e-7a9f3494708e`.
2. Retain the authoritative design's already-correct topology identity and
   record this amendment in its current status.
3. Do not change bootstrap sequencing, credential policy, source-link policy,
   Wait for CI policy, autodeploy policy, application code, IaC behavior, or
   remote Railway state.
4. Preserve completed reviews and historical operations evidence as immutable
   snapshots. The immutable
   `docs/operations/production-cutover-evidence-2026-09-17.md` is internally
   inconsistent: its earlier topology summary contains the truncated identity
   `4d0a3739-0beb-4ea9-9a7f3494708e`, while its later Railway read-back contains
   the full verified identity
   `4d0a3739-0beb-4ea9-9a7e-7a9f3494708e`. Do not rewrite that historical
   evidence. The authoritative correction rests on the current live Railway
   identity, the later verified full-UUID evidence, and the corrected current
   bootstrap plan and CI/CD runbook; it does not treat the historical artifact
   as internally consistent.
5. Treat the earlier bootstrap approval as unconsumed and non-reusable. After
   this amendment passes immutable design review, require a new explicit human
   approval before returning to implementation or executing any bootstrap step.

This amendment authorizes no GitHub push or merge, Railway deployment,
credential installation, variable change, IaC plan or apply, source
connection, Wait for CI change, autodeploy change, migration, or other remote
mutation.

## Review and approval trail

Design Review 11 identified `LOW-01` in the amendment's description of the
immutable evidence. The first revision then claimed that the historical file
already agreed with the verified identity. Design Review 12 found that claim
incomplete because the file contains both an earlier truncated UUID entry and
a later full verified UUID entry. Item 4 now records both references, does not
claim internal consistency, and leaves the historical file unchanged.

Design Review 13 approved this revised amendment, including the authoritative
design status and the two corrected current operational references, and
resolved `LOW-01`. The workflow remains at the explicit `design_approval`
human gate. No prior bootstrap approval may satisfy that gate; implementation
requires a new explicit approval, which this status repair does not consume.
