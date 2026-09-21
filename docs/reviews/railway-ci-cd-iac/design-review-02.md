# Design Review 02 — Railway GitHub CI/CD and IaC

## Review metadata

- **Work item:** `railway-ci-cd-iac` (`infrastructure`)
- **Authoritative design:** `docs/technical-designs/railway-ci-cd-iac.md`
- **Workflow phase reviewed:** `design_review`
- **HEAD at review:** `1d95822ceafb5901199247df26e53112c7bee4d9`
- **Date:** 2026-09-19
- **Verdict:** `CHANGES REQUIRED`

## Preflight and scope

`PREFLIGHT PASSED`. The workflow YAML parses; its identifier, design path, current design slice, prior immutable review, active findings, context references, and `design_review` routing agree. The five proposed slices exist. There is no active human gate or claimed completion transition.

Reviewed the revised design against Review 01, the repository's `Validate` workflow and `railway.json`, and current official [Railway Wait for CI](https://docs.railway.com/deployments/github-autodeploys), [pre-deploy](https://docs.railway.com/deployments/pre-deploy-command), [staged changes](https://docs.railway.com/deployments/staged-changes), [GitHub Actions run API](https://docs.github.com/en/rest/actions/workflow-runs), and [jobs API](https://docs.github.com/en/rest/actions/workflow-jobs) documentation. This review made no application or production changes.

## Prior findings

- **HIGH-01 resolved in design:** The new verifier requires a successful `push` workflow, exact full SHA, successful `validate` job, and successful named steps before migration or startup. The design explicitly identifies the remaining possibility that Railway builds before the verifier runs and requires a human decision on that residual risk before autodeploy.
- **HIGH-02 resolved in design:** Source connection now requires evidence of first-link behavior *before* mutation, a proven safe order, and a stop condition if that proof is unavailable. It also defines containment and read-back if a deployment appears unexpectedly.
- **MEDIUM-01 resolved in design:** The proposed fixture passes PR validation, fails only the post-merge `main` push, requires a Railway `SKIPPED` record for the exact SHA, and includes a recovery PR and an unresolved-evidence path that cannot silently complete the work item.

## New blocking findings

### HIGH-03 — The verifier installation sequence does not establish an executable production guard

**Evidence:** Slice 4 says to implement the verifier and apply an IaC change that prepends it to the production pre-deploy command, then enable its required variable before source connection. The existing production image was built from the previous CLI source and contains no verifier. The design does not establish whether the IaC/variable changes cause or require a deployment, which source that deployment would use, or how the command is tested against the exact image used at first GitHub linkage. Railway pre-deploy executes inside the built image and blocks deployment on nonzero exit ([pre-deploy](https://docs.railway.com/deployments/pre-deploy-command)); Railway variable changes can be staged and redeploy affected services when deployed ([variables](https://docs.railway.com/variables), [staged changes](https://docs.railway.com/deployments/staged-changes)). A nonproduction parser test and configuration read-back do not prove that the production command can find and execute the verifier.

**Impact:** The guard could fail every new production deployment because its script is absent, or an interim deployment could occur before the guard is active. Either case breaks the proposed first-link sequence and may leave the operator without a tested release path.

**Required revision:** Specify the exact artifact and command used by pre-deploy, then order the repository commit, any controlled CLI deployment, IaC apply, required variable, and source connection so each deployment has a compatible image and settings. Establish from current Railway behavior whether the IaC and variable changes trigger deployment or require staged deployment. Prove a production-scoped *safe* negative invocation of the effective guard, or provide an equivalent verified procedure, before source connection. State what to do if a configuration change itself creates an unexpected deployment.

### MEDIUM-02 — The GitHub API credential option contradicts the declared scope

**Evidence:** The goal says no new secret is part of the work item, while the verifier section permits a new fine-grained GitHub Actions token in Railway if anonymous access is unavailable or rate-limited. GitHub's [workflow-run](https://docs.github.com/en/rest/actions/workflow-runs) and [job](https://docs.github.com/en/rest/actions/workflow-jobs) endpoints allow unauthenticated access for public resources but require a read permission for private resources. The design has not committed to a credential-free public-repository path or specified how a token would be issued, scoped, rotated, and revoked if required.

**Impact:** The implementation might introduce a production secret outside the reviewed boundary, or discover too late that anonymous API access cannot support the fail-closed release path.

**Required revision:** Verify repository visibility and expected GitHub API access before choosing the credential path. Either require credential-free access with a tested rate-limit budget and fail-closed behavior, or explicitly include the narrowly scoped token and its owner, storage, rotation/revocation, and separate approval in this work item. Make the goal, slice, and acceptance criteria consistent.

## Assessment and transition

The design is clearer and safer than Review 01. Its topology preservation, separate IaC apply path, first-link stop condition, and protected-branch negative test are sound design choices. The two new findings concern the bootstrap of the central preventive control and the credential boundary; both need resolution before a production implementation can be approved.

**`CHANGES REQUIRED`**. Return to `design` with `HIGH-03` and `MEDIUM-02` active. Revise the authoritative design and submit a new immutable review. No implementation, GitHub settings change, Railway configuration change, source connection, or production deployment is authorized by this review.
