# Design Review 11 — Production web-service identity correction

## Review metadata

- **Work item:** `railway-ci-cd-iac` (`infrastructure`)
- **Current slice:** `railway-github-autodeploy`
- **Authoritative design:** `docs/technical-designs/railway-ci-cd-iac.md`
- **Amendment reviewed:** `docs/reviews/railway-ci-cd-iac/design-amendment-03-production-web-service-identity.md`
- **Workflow phase reviewed:** `design_review`
- **HEAD at review:** `156990149fdaecdf032ca923e0a1190069bc93e8`
- **Date:** 2026-09-24
- **Verdict:** `CHANGES REQUIRED`

## Preflight

`PREFLIGHT PASSED`. The YAML state parses and identifies the infrastructure
work item, approved authoritative design, pending production-web-service
identity amendment, prior approved Design Review 10, paused
`railway-github-autodeploy` slice, and matching `design_review` routing. Every
referenced design, amendment, review, and context artifact exists. The current
slice and the later `end-to-end-cicd-acceptance` slice are present in the
authoritative design. There is no active gate or blocking finding, and no
next-slice or completion transition is claimed.

## Evidence and assessment

The amendment addresses a concrete operator-safety defect. The bootstrap plan
and current CI/CD runbook now identify the production web service as
`4d0a3739-0beb-4ea9-9a7e-7a9f3494708e`. That value matches the authoritative
design, production cutover guide, retirement manifest and record, and the
earlier IaC parity operator plan. The malformed shorter value is no longer
present in either current operator document.

The recorded read-only Railway preflight is internally consistent: the full
web-service identity is associated with the expected project and production
environment, existing domain, successful running deployment, unset source,
PostgreSQL service, ready volume, and present PITR bucket. Requiring another
identity read-back immediately before every remote action preserves the
fail-closed protection against stale infrastructure evidence. This review did
not repeat the provider query and made no remote change.

The correction is minimal and feasible. It changes only two current operator
references plus design and workflow status; it does not alter bootstrap
ordering, credential scope, IaC behavior, source-link policy, Wait for CI,
autodeploy, migration behavior, topology, or application code. It introduces
no abstraction or new slice. Keeping completed reviews and historical
evidence immutable preserves auditability while the explicit amendment and
current runbooks make the executable identity unambiguous.

Operational risk is otherwise appropriately contained. The prior bootstrap
approval is declared unconsumed and non-reusable, the current slice remains
paused, and a new explicit design approval is required before implementation
resumes or any deployment, credential, variable, IaC, SSH, source, Wait for
CI, or autodeploy action occurs. Existing first-link proof and separate
operator-approval gates remain unchanged.

## Findings and verdict

### LOW-01 — Amendment inaccurately describes immutable historical evidence

Amendment 03 says that
`docs/operations/production-cutover-evidence-2026-09-17.md` contains the stale
truncated web-service identity and is intentionally not rewritten. The cited
immutable file instead already contains the full correct identity
`4d0a3739-0beb-4ea9-9a7e-7a9f3494708e`. This does not weaken the operator
correction, but it makes the amendment's audit account factually inaccurate.
Revise item 4 to state that the historical evidence is preserved and already
agrees with the verified identity, or remove the unsupported stale-identity
claim. Do not modify the historical evidence file.

**`CHANGES REQUIRED`**. Transition to `design` to address `LOW-01`, then submit
the amendment for a new immutable design review. The
`railway-github-autodeploy` slice remains paused. No human approval is
currently consumable, and this review authorizes no implementation,
deployment, credential installation, Railway variable or IaC mutation, SSH
proof, source connection, Wait for CI change, autodeploy change, migration, or
other provider mutation.
