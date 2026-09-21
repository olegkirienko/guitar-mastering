# Design Review 01 — Railway GitHub CI/CD and IaC

## Review metadata

- **Work item:** `railway-ci-cd-iac`
- **Type:** `infrastructure`
- **Authoritative design:** `docs/technical-designs/railway-ci-cd-iac.md`
- **Workflow phase reviewed:** `design_review`
- **HEAD at review:** `1d95822ceafb5901199247df26e53112c7bee4d9`
- **Date:** 2026-09-19
- **Verdict:** `CHANGES REQUIRED`

## Preflight

`PREFLIGHT PASSED`. The workflow state parses as YAML, identifies the work item and type, references the existing draft design and existing context files, has canonical `phase: design_review` with matching `next.phase`, has no active gate or blocking findings, and records no prior review. `current_slice: design` is compatible with this phase. The proposed first and later slices exist in the design; no next implementation slice or completion gate is claimed yet.

## Scope and evidence

Reviewed goal, scope, feasibility, deployment and recovery safety, security, validation, and slice boundaries against the design and the local `Validate`, `railway.json`, runtime configuration, and production runbook. Checked current official [Railway Wait for CI behavior](https://docs.railway.com/deployments/github-autodeploys), [Railway IaC migration behavior](https://docs.railway.com/infrastructure-as-code), [Railway service source behavior](https://docs.railway.com/services), and [GitHub required check](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches) and [workflow skip](https://docs.github.com/en/actions/how-tos/manage-workflow-runs/skip-workflow-runs) rules. No production setting or application code was changed.

## Assessment

The design has a clear release target and identifies the correct production resources to preserve. It keeps application autodeploy separate from manual IaC apply and production migrations in Railway pre-deploy. The Config as Code handoff accounts for Railway's prohibition on planning a service while its legacy association remains active; its no-destroy plan and read-back requirements are appropriate. The five slices separate configuration migration, GitHub validation, metadata, source connection, and acceptance. The design also avoids adding a Railway deployment token to GitHub CI.

The two safety gaps below block approval because they sit at the transition from reviewed repository changes to automatic production deployment. The acceptance gap is narrower but needs a testable procedure before the final slice can be considered complete.

## Findings

### HIGH-01 — A successful `Validate` is not an enforced prerequisite for automatic deployment

**Evidence:** The design accurately states that Railway ignores skipped/neutral workflows and can ignore a cancelled workflow when another workflow on the same commit succeeds. It then says the operator will detect an unvalidated `Validate` and halt rollout. Railway may already have left `WAITING` and started deployment before that observation. The design also preserves `workflow_dispatch`, so another successful run on a SHA is possible, and only proposes to review other workflows instead of imposing a hard condition on the enabled workflow set. GitHub required checks govern the PR merge and accept skipped/neutral conclusions in some cases; they do not supply a required post-merge `Validate` conclusion to Railway. Railway documents these exact [Wait for CI rules](https://docs.railway.com/deployments/github-autodeploys), and GitHub documents the [required-check conclusions](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches).

**Impact:** A `main` commit could be built and promoted without a successful `Validate` for its exact SHA, contradicting the stated production gate. Post-deployment log inspection cannot prevent promotion.

**Required revision:** Define objective, pre-enable controls for every success-producing workflow/run on `main`, manual dispatch of `Validate` against an outstanding SHA, workflow skip directives, and cancellation. State precisely which Railway conclusions can still bypass the desired invariant after those controls. If native Wait for CI cannot enforce success of `Validate` in all reachable cases, either add a supported preventive mechanism consistent with the requested architecture or explicitly present the residual risk and require a decision before autodeploy is enabled. Do not claim exact-SHA `Validate` success is automatic merely because the acceptance observer checks it afterward.

### HIGH-02 — First-link safety depends on learning source behavior after the production source is changed

**Evidence:** The design says to keep autodeploy disabled while selecting the repo “if the UI permits,” then verify settings, and only “if linking necessarily triggers a build or enables autodeploy” to stop and find another procedure. The detection point can be after an unintended build has already started. Railway documents that connected services deploy commits pushed to their branch and that an existing service's source can be changed, but the design does not establish an actionable, verified ordering for source connection, disabled autodeploy, Wait for CI, and the initial commit ([services](https://docs.railway.com/services), [autodeploys](https://docs.railway.com/deployments/github-autodeploys)).

**Impact:** Connecting the existing production service could deploy a commit before the CI gate is enabled. Preservation of service identity would not prevent an unvalidated image or migration from running.

**Required revision:** Make a read-only proof of the exact first-link behavior a prerequisite **before** changing production source. Specify the safe supported sequence, with a pre-action stop condition if the operator cannot establish that no build/deploy will trigger until Wait for CI is active. Define the exact rollback/containment action if Railway unexpectedly creates a deployment during linking, including confirmation that the prior deployment remains serving. Keep the web service identity and all database resources unchanged.

### MEDIUM-01 — The negative acceptance test has no reproducible protected-branch procedure

**Evidence:** The design suggests a CI-only failing test introduced through PRs, but does not specify how PR `Validate` can pass while the post-merge `main` run fails, how the failure remains application-inert, how the recovery commit is merged, or what evidence distinguishes Railway skipping the failed SHA from simply never seeing it. The text allows the negative test to remain unproven while still listing `end-to-end-cicd-acceptance` as the final slice.

**Impact:** The work item could reach completion without proving its central failure path, or an operator could weaken branch protection to manufacture a failed `main` run.

**Required revision:** Define a controlled, reversible PR-to-`main` failure fixture that passes PR validation and fails only the `main` push run without affecting the running application, plus its reviewed recovery PR. Require evidence that Railway received that exact SHA and marked it skipped for CI failure, while the previous deployment and smoke checks remain healthy. If platform behavior or repository policy makes this impossible, specify the alternative evidence and an explicit unresolved acceptance decision rather than silently completing the work item.

## Verdict and transition

**`CHANGES REQUIRED`**. Return to `design` with `HIGH-01`, `HIGH-02`, and `MEDIUM-01` active. Revise the authoritative design, then run a new immutable design review. This review does not authorize implementation, GitHub settings changes, Railway source connection, IaC apply, or a production deployment.
