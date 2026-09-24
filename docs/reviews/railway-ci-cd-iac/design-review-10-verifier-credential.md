# Design Review 10 — Verifier GitHub API credential amendment

## Review metadata

- **Work item:** `railway-ci-cd-iac` (`infrastructure`)
- **Current slice:** `railway-github-autodeploy`
- **Authoritative design:** `docs/technical-designs/railway-ci-cd-iac.md`
- **Amendment reviewed:** `docs/reviews/railway-ci-cd-iac/design-amendment-02-verifier-credential.md`
- **Workflow phase reviewed:** `design_review`
- **HEAD at review:** `156990149fdaecdf032ca923e0a1190069bc93e8`
- **Date:** 2026-09-22
- **Verdict:** `APPROVED`

## Preflight

`PREFLIGHT PASSED`. The YAML state parses and identifies the infrastructure
work item, approved authoritative design, pending verifier-credential
amendment, prior approved Implementation Review 09, paused
`railway-github-autodeploy` slice, and matching `design_review` routing. Every
referenced design, amendment, review, and context artifact exists. The current
slice is present in the authoritative design, there is no active gate or
blocking finding, and no next-slice or completion transition is claimed.

## Evidence and assessment

The amendment resolves the public-repository credential decision without
weakening the exact-SHA promotion guard. GitHub's current
[workflow-runs documentation](https://docs.github.com/en/rest/actions/workflow-runs#list-workflow-runs-for-a-workflow)
confirms that the pinned workflow endpoint accepts the workflow filename plus
`branch`, `event`, `head_sha`, and `per_page` filters. Its
[workflow-jobs documentation](https://docs.github.com/en/rest/actions/workflow-jobs#list-jobs-for-a-workflow-run)
confirms that the jobs endpoint supports `filter=latest` and up to 100 results
per page. Both endpoints permit unauthenticated reads for public resources and
require only repository `Actions: read` for a fine-grained token.

GitHub's current
[rate-limit documentation](https://docs.github.com/en/rest/using-the-rest-api/rate-limits-for-the-rest-api)
confirms the amendment's central operational distinction: unauthenticated
requests share 60 requests per hour by originating IP, while personal access
token requests share the authenticated user's 5,000-request hourly budget.
The recorded live checks returned `200` for both endpoints in both modes. A
normal verification needs two requests and the design caps the worst case at
four, so the authenticated choice has ample headroom for the stated maximum of
ten candidate deployments per hour. Avoiding an anonymous fallback prevents a
missing or rejected token from silently switching to a smaller shared budget.

The security boundary is appropriately narrow. The proposed fine-grained
token is repository-specific, read-only, expires within 90 days, stored only as a
sealed production service variable, excluded from IaC values and diagnostics,
and never sent outside the GitHub authorization header. The public repository
means the token grants no write capability and no access to a second
repository. The design explicitly treats missing credentials, authentication
failures, rate-limit exhaustion or low headroom, malformed responses,
pagination uncertainty, redirects, timeouts, network failures, and unexpected
status codes as pre-migration failures.

The operational lifecycle is complete enough for implementation. Rotation is
required at least seven days before expiry under a separately reviewed
variable action, with deployed-image endpoint and positive-verifier proof
before old-token revocation. Suspected disclosure requires immediate
revocation, autodeploy containment, confirmation that the previous healthy
deployment remains serving, and a reviewed replacement. Repository
visibility, ownership, workflow identity, API contract, credential policy, or
release-volume changes require renewed design review.

Implementation remains feasible with the existing Node build and requires no
new abstraction or dependency. The request contract pins repository, workflow,
branch, event, and full SHA; caps pages and retries; validates response counts,
rate-limit metadata, run/job/step conclusions, and nonsecret errors; and keeps
migration behind verifier success. Unit fixtures and the mandatory
production-image positive and negative invocations provide proportionate
validation. The existing first-link proof, bootstrap ordering, topology
preservation, and stop conditions remain unchanged.

The residual risks are explicit and controlled. The personal rate budget is
shared with the owner's other authenticated API use, but the 100-request
fail-closed floor prevents a release from consuming the final budget. A
human-owned expiring credential adds rotation work, but the bounded expiry,
advance rotation window, review requirement, rollback path, and no-anonymous-
fallback rule make that tradeoff preferable to relying on unisolated Railway
egress IP capacity. A GitHub App would add lifecycle and key-management
complexity without improving the required read-only repository scope for this
work item.

## Findings and verdict

No actionable findings. No active blocking findings.

**`APPROVED`**. Transition to `human_gate / design_approval`. The
`railway-github-autodeploy` slice remains paused until the owner explicitly
approves Design Amendment 02. This review does not authorize verifier
implementation, token creation, Railway variable or IaC changes, source
connection, Wait for CI, autodeploy, deployment, migration, or any other
provider mutation.
