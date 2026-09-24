# Design Review 12 — Production web-service identity correction

## Review metadata

- **Work item:** `railway-ci-cd-iac` (`infrastructure`)
- **Current slice:** `railway-github-autodeploy`
- **Authoritative design:** `docs/technical-designs/railway-ci-cd-iac.md`
- **Amendment reviewed:** `docs/reviews/railway-ci-cd-iac/design-amendment-03-production-web-service-identity.md`
- **Prior review:** `docs/reviews/railway-ci-cd-iac/design-review-11-production-web-service-identity.md`
- **Workflow phase reviewed:** `design_review`
- **HEAD at review:** `156990149fdaecdf032ca923e0a1190069bc93e8`
- **Date:** 2026-09-24
- **Verdict:** `CHANGES REQUIRED`

## Preflight

`PREFLIGHT PASSED`. The YAML state parses and identifies the infrastructure
work item, approved authoritative design, revised production-web-service
identity amendment, immutable Design Review 11 with active `LOW-01`, paused
`railway-github-autodeploy` slice, and matching `design_review` routing. Every
referenced design, amendment, review, and context artifact exists. The current
slice and later `end-to-end-cicd-acceptance` slice are present in the
authoritative design. No gate, next-slice transition, or completion transition
is claimed.

## Re-review of LOW-01

`LOW-01` is not resolved. The attempted correction says that
`docs/operations/production-cutover-evidence-2026-09-17.md` already contains
the verified full identity, but the immutable file contains both identities:
line 13 uses the truncated value `4d0a3739-0beb-4ea9-9a7f3494708e`, while line
137 uses the full value `4d0a3739-0beb-4ea9-9a7e-7a9f3494708e`. The file was
correctly left unchanged, but Amendment 03's revised audit statement is still
factually incomplete.

The full identity matches both current operator documents, the authoritative
topology, production cutover guide, retirement record, and the earlier IaC
parity plan. The truncated identity is absent from current executable operator
references.

## Design assessment

The amendment remains clear and narrowly bounded. It corrects an operator
target without altering topology, bootstrap ordering, credential policy,
source-link safeguards, Wait for CI behavior, autodeploy policy, IaC behavior,
migration handling, rollback, application code, or slice boundaries. It adds
no abstraction or resource.

Implementation feasibility and validation remain proportionate: re-read every
identity before remote action, stop on any mismatch, and preserve the existing
first-link evidence gate and separate operator approvals. Recovery continues
to rely on the recorded healthy deployment and unchanged service, domain,
database, volume, and PITR identities. The prior bootstrap approval remains
unconsumed and explicitly cannot satisfy the new approval gate. This review
performed no provider query or mutation.

## Findings and verdict

### LOW-01 — Historical evidence contains both service identities

Revise Amendment 03 item 4 and its review trail to state precisely that the
immutable 2026-09-17 cutover evidence contains the truncated identity in its
early topology summary and the full verified identity in its later Railway
read-back. Preserve that historical file unchanged. This replaces neither the
current operator correction nor the requirement to re-read live identity
before mutation.

**`CHANGES REQUIRED`**. Transition to `design` to address `LOW-01`, then submit
the amendment for a new immutable design review. The
`railway-github-autodeploy` slice remains paused. No human approval is
currently consumable, and this review authorizes no implementation,
deployment, credential installation, Railway variable or IaC mutation, SSH
proof, source connection, Wait for CI change, autodeploy change, migration, or
other provider mutation.
