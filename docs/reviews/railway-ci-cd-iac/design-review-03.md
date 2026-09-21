# Design Review 03 — Railway GitHub CI/CD and IaC

## Review metadata

- **Work item:** `railway-ci-cd-iac` (`infrastructure`)
- **Authoritative design:** `docs/technical-designs/railway-ci-cd-iac.md`
- **Workflow phase reviewed:** `design_review`
- **HEAD at review:** `1d95822ceafb5901199247df26e53112c7bee4d9`
- **Date:** 2026-09-20
- **Verdict:** `APPROVED`

## Preflight

`PREFLIGHT PASSED`. The YAML state parses and identifies the work item, design, current design slice, prior immutable review, active `HIGH-03` and `MEDIUM-02`, existing context files, and matching `design_review` routing. There is no active gate. The proposed first implementation slice, `railway-iac-parity-foundation`, and four later slices are present in the authoritative design.

## Evidence and assessment

Reviewed goal, scope, topology preservation, credential boundary, IaC handoff, CI semantics, deployment sequence, observability, acceptance, recovery, and slice boundaries against the previous review, local `tsconfig.server.build.json`, `Validate`, and `railway.json`. Checked current official [Railway pre-deploy](https://docs.railway.com/deployments/pre-deploy-command), [variables](https://docs.railway.com/variables), [staged changes](https://docs.railway.com/deployments/staged-changes), [GitHub workflow runs](https://docs.github.com/en/rest/actions/workflow-runs), and [workflow jobs](https://docs.github.com/en/rest/actions/workflow-jobs) documentation. No application code or remote setting was changed.

**HIGH-03 resolved in design.** The design now names `server/verify-ci.ts`, its compiled `dist-server/verify-ci.js` artifact, the package script, and the effective Railway command. It places a reviewed CLI deployment of the artifact before token or command activation, tests the actual active image via Railway SSH, treats config/variable activation as potentially redeploying the service, and requires an image-local negative result before source connection. Each configuration step has deployment-history and smoke read-back; uncertainty or unexpected promotion stops the sequence. Railway documents that pre-deploy needs its dependencies in the image and that staged changes can redeploy affected services, which the new order addresses.

**MEDIUM-02 resolved in design.** An authenticated repository visibility check found the repository private. The scope now explicitly includes one Railway-stored, repository-restricted token with `Actions: read`, owner approval, expiry, rotation, revocation, no source/log exposure, and API failure behavior. GitHub documents that this permission covers the workflow-run and job endpoints for private repositories. The token is provisioned in slice 4 under a reviewed operator plan, not during this design review.

The earlier `HIGH-01`, `HIGH-02`, and `MEDIUM-01` remain resolved as recorded in Design Review 02. The design clearly states that Railway may build before the image-local verifier runs; design approval must include acceptance of that residual build risk. First-link behavior remains an explicit evidence gate inside slice 4: if safe ordering cannot be proved before the source mutation, the slice must stop for a design amendment. The protected-branch negative test has an evidence requirement that blocks silent completion. These are operational gates, not unreviewed assumptions.

## Findings and verdict

No active blocking findings. No new actionable findings.

**`APPROVED`**. Transition to `human_gate / design_approval`. Approval of this design is required before `railway-iac-parity-foundation` can begin. This review does not itself authorize implementation, a Railway IaC apply, GitHub ruleset change, source connection, token creation, or production deployment.
