# Design Amendment 02 — Verifier GitHub API credential

**Work item:** `railway-ci-cd-iac` (`infrastructure`)

**Current slice:** `railway-github-autodeploy`

**Authoritative design:** `docs/technical-designs/railway-ci-cd-iac.md`

**Date:** 2026-09-22

**Status:** submitted for design review; no review verdict or approval recorded

## Evidence and decision

The repository is public. On 2026-09-22, read-only calls against the pinned
`olegkirienko/guitar-mastering` repository proved that both API operations the
exact-SHA verifier needs are available anonymously and with authentication:

- `GET /repos/olegkirienko/guitar-mastering/actions/workflows/ci.yml/runs`
  with `branch=main`, `event=push`, and `per_page=1` returned `200`, the latest
  successful push run, and anonymous core limits `60` total, `59` remaining;
- `GET /repos/olegkirienko/guitar-mastering/actions/runs/35590758279/jobs`
  with `filter=latest` and `per_page=100` returned `200`, the single successful
  `validate` job and all sixteen steps, leaving `58` anonymous requests;
- the same two calls through the owner's authenticated GitHub CLI session
  returned `200` and authenticated core limits `5000` total, then `4999` and
  `4998` remaining. No credential value was displayed or copied into the
  repository.

GitHub documents that both public-resource endpoints permit unauthenticated
access, while a fine-grained token uses repository `Actions: read`. GitHub also
documents a primary limit of 60 requests per hour for an unauthenticated source
IP and 5,000 per hour for an authenticated user. The verifier normally needs
two requests per candidate deployment and may use at most one bounded retry per
endpoint, for an upper bound of four. The operational envelope is no more than
ten candidate deployments in an hour, or at most 40 requests. Although that
fits the nominal anonymous allowance, anonymous accounting is shared by source
IP and Railway egress isolation is not guaranteed. Unrelated traffic could
therefore exhaust the 60-request budget and block a valid production release.

Select **authenticated access**. The substantially larger authenticated budget
provides reliable headroom while preserving fail-closed behavior. Anonymous
access remains useful only as design evidence and must not be an automatic
runtime fallback: a missing or rejected credential fails the deployment before
migration.

Official references:

- [Workflow-runs endpoint](https://docs.github.com/en/rest/actions/workflow-runs#list-workflow-runs-for-a-workflow)
- [Workflow-jobs endpoint](https://docs.github.com/en/rest/actions/workflow-jobs#list-jobs-for-a-workflow-run)
- [REST API rate limits](https://docs.github.com/en/rest/using-the-rest-api/rate-limits-for-the-rest-api)

## Narrow design change

1. The production verifier must require `GITHUB_ACTIONS_READ_TOKEN` and send it
   only in the GitHub API `Authorization: Bearer` header. It must never fall back
   to anonymous access.
2. The credential must be a fine-grained personal access token owned by the
   repository owner, restricted to only `olegkirienko/guitar-mastering`, with
   repository `Actions: read`, unavoidable metadata read access, no write
   permission, and an expiry of at most 90 days.
3. Store the token only as a sealed Railway production-web-service variable.
   IaC may preserve its reference but must not contain or print its value.
   Application logs, errors, review artifacts, plans, command output, and test
   fixtures must not include the token or the authorization header.
4. Each verifier execution may make one workflow-runs request filtered by the
   full deployment `head_sha`, `branch=main`, and `event=push`, followed by one
   jobs request for the selected run; request `per_page=100` and reject a
   response whose count exceeds its returned array or whose `Link` header has a
   next page. Each endpoint permits at most one bounded retry for a transient
   network error or `5xx`; do not retry `401`, `403`, or `429`. Require the
   `core` rate-limit resource and at least 100 remaining requests after a
   successful response. Missing or malformed rate-limit headers, a lower
   remainder, pagination uncertainty, an unexpected redirect, timeout, network
   failure, malformed JSON, or any non-`200` response fails before migration.
5. Before production activation, prove from the deployed image that the sealed
   credential can read both pinned endpoints, that a known successful `main`
   SHA passes, and that an impossible full SHA fails without running migration.
   Record only response status, rate-limit metadata, run/job identifiers, exit
   status, and redacted diagnostics.
6. Create and install the credential only under a separately reviewed operator
   action after this amendment passes immutable design review and explicit
   `design_approval`. No credential, Railway variable, IaC, verifier, source,
   Wait for CI, autodeploy, or production setting is authorized by this
   submitted amendment.

## Lifecycle and failure handling

- Rotate at least seven days before expiry through a separately reviewed
  production-variable action. Create the replacement with the same scope,
  replace the sealed value without revealing either value, prove both API calls
  and a positive verifier result from the deployed image, and only then revoke
  the old token. If proof fails, keep autodeploy disabled, restore the prior
  reviewed credential if safe, and revoke the failed replacement.
- On suspected disclosure, revoke the credential immediately, disable further
  autodeploy/source changes, confirm the previous healthy deployment remains
  serving, and require a new reviewed replacement action before releases
  resume. A revoked, expired, absent, or rate-limited token must fail before
  migration; it must never trigger anonymous fallback.
- A repository visibility, ownership, workflow identity, GitHub API contract,
  or credential-policy change requires a new design amendment. If expected
  release volume could exceed ten candidate deployments per hour, pause and
  review the request budget rather than weakening the remaining-limit guard.

## Review and approval trail

Next action: a new immutable design review must assess this amendment and the
revised authoritative design. If approved, transition to an explicit
`design_approval` human gate before any `railway-github-autodeploy`
implementation or provider configuration begins. Findings and verdict belong
in the new review artifact, not in this submitted amendment record.
