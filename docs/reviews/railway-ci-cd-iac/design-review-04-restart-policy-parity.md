# Design Review 04 — Railway restart-policy parity amendment

## Review metadata

- **Work item:** `railway-ci-cd-iac` (`infrastructure`)
- **Authoritative design:** `docs/technical-designs/railway-ci-cd-iac.md`
- **Amendment reviewed:** `docs/reviews/railway-ci-cd-iac/design-amendment-01-restart-policy-parity.md`
- **Workflow phase reviewed:** `design_review`
- **HEAD at review:** `1d95822ceafb5901199247df26e53112c7bee4d9`
- **Date:** 2026-09-20
- **Verdict:** `APPROVED`

## Preflight

`PREFLIGHT PASSED`. The YAML state parses and identifies the infrastructure
work item, authoritative design, pending amendment, prior immutable Design
Review 03, paused `railway-iac-parity-foundation` slice, and matching
`design_review` routing. All referenced artifacts exist. There is no active
gate or blocking finding. The current slice and four later slices are present
in the authoritative design; no next slice or completion gate is claimed.

## Evidence and assessment

The operator record shows a reviewed production IaC apply followed by an
unchanged effective `ON_FAILURE` policy with three retries. Independent fresh
raw configuration reads omit `restartPolicyType`, while the active deployment
and service instance report `ON_FAILURE` and three retries. The next fresh IaC
plan proposes only `restartPolicyType: null → "ON_FAILURE"`. These recorded
observations support a narrow exception for this field on this service; they
do not establish that Railway generally lacks support for explicit restart
policies. Railway's current [restart-policy documentation](https://docs.railway.com/deployments/restart-policy)
confirms `On Failure` as the default. Its [IaC documentation](https://docs.railway.com/infrastructure-as-code)
describes plan/apply behavior. This review did not rerun a production plan or
make a remote change.

The design is scoped to one field: omit `deploy.restartPolicyType` from IaC,
retain `deploy.restartPolicyMaxRetries: 3`, and require a clean plan for all
supported round-trippable fields. It separately requires effective service
and active-deployment read-back of `ON_FAILURE` with three retries after each
deployment. An absent, conflicting, or unavailable effective value blocks
acceptance. The operator plan preserves the prior handoff and apply as
historical evidence, calls for a fresh redacted plan after the source-only
edit, and keeps `railway.json` until the amended parity, topology, and health
checks pass. No further IaC apply is proposed merely to omit the field.

This addresses the observed drift without weakening the required effective
restart behavior. It is feasible within the existing first slice and adds no
resource, credential, deployment, or future slice. The remaining platform
risk is explicit: a Railway default or read model could change. The required
post-deployment check detects an effective-policy change; restoring explicit
IaC ownership would require a later reviewed amendment once the field
round-trips reliably.

## Findings and verdict

No actionable findings. No active blocking findings.

**`APPROVED`**. Transition to `human_gate / design_approval`. The existing
`railway-iac-parity-foundation` slice remains paused until the owner explicitly
approves this amended design. This review authorizes no IaC source edit,
Railway apply, `railway.json` removal, application change, or production
mutation.
