# Delivery Retry Hardening

## Goal

Close the two gaps exposed by the `orchestration-usage-optimization` delivery on
2026-09-30. The evidence is in
`docs/delivery-evidence/orchestration-usage-optimization/delivery-01.md` on the
retained branch `work/orchestration-usage-optimization`.

1. **Transient step data fails a correct deploy.** Deployment `b68b1759…` for
   `732e2bb…` failed pre-deploy with `Required validation step did not succeed:
   Install dependencies.`, although push run `36725741099` and all six required
   steps had succeeded. The same built verifier later passed against the same
   run. GitHub returned incomplete job-step data at that moment.
2. **The delivery retry has no legal workflow state.** A post-merge production
   retry needs `production_mutation_approval`, but the validator forces every
   non-merge, non-completion gate to route to `implementation`. The approval
   could only be recorded in the evidence artifact.

## Non-goals

- Retrying on anything other than incomplete step data. Network errors and 5xx
  keep their existing single retry; auth, rate-limit, pagination, redirect,
  malformed-response, wrong-run, and explicit step failures stay immediate
  failures.
- Changing which run, job, or steps are required, or the bypass semantics.
- Changing CI, Railway configuration, variables, credentials, or the database.
- Allowing any other gate type to route to delivery verification, or allowing
  a production gate after merge to route back to implementation.

## Design

### Verifier: bounded re-read of incomplete step data

`verifyCi` in `server/verify-ci.ts` keeps its run lookup unchanged. Once the one
matching run and its single `validate` job are found with `status: completed`
and `conclusion: success`, each required step is classified:

- **passed:** exactly one step with that name and `conclusion: "success"`;
- **incomplete:** no step with that name, or exactly one with
  `conclusion: null`;
- **failed:** duplicated, or any other conclusion (`skipped`, `failure`,
  `cancelled`, …).

Any failed step fails immediately, exactly as today. If a step is incomplete
and none failed, the verifier waits and re-reads only the jobs endpoint of the
same run. It makes at most 4 jobs reads in total, 15 seconds apart, so it adds
at most 45 seconds and 3 extra requests. Every re-read goes through the same
request, metadata, rate-limit, parsing, single-job, and job-conclusion checks.
Success still requires all six steps to pass in a single read.

When reads are exhausted, the error keeps the existing prefix and adds what was
observed, without secrets:
`Required validation step did not succeed: Install dependencies (missing after 4 job reads).`

The wait is injected (`verifyCi(environment, fetch, wait)`, defaulting to a
real timer), so tests run without delays. Railway's pre-deploy command has no
configured timeout, and 45 seconds stays well inside normal deploy time.

### Workflow contract: post-merge production retry gate

In `scripts/validate-workflow-contract.mjs`, a v3.1 state at
`human_gate / production_mutation_approval` with a non-null `git.merged_sha`
must route `next.on_approval` to `delivery_verification` with a
`retry-delivery-<id>` action. Before merge the existing rule (`implementation`
with `implement-` or `resume-`) is unchanged. The existing `gate_scope` checks
(provider, environment ID, targets, operation or plan digest, stop conditions)
apply to both.

New fixtures:

- **legal:** a post-merge production gate routing to
  `delivery_verification / retry-delivery-01`;
- **illegal:** the same gate routing to `implementation` after merge, and
  routing to `delivery_verification` before merge.

`.codex/skills/delivery-verification/SKILL.md` gains one instruction: a
production retry enters `human_gate / production_mutation_approval` with the
pinned `gate_scope` and `next.on_approval: delivery_verification /
retry-delivery-<id>`, and each attempt that the approval allows is recorded in
the delivery evidence. `docs/operations/railway-ci-cd.md` documents the
step-data re-read next to the existing single retry.

## Safety

- The re-read can only delay a decision. It can never turn missing or
  contradictory evidence into success: every read must independently prove the
  full required set.
- Explicit failures never wait, so a real CI failure fails as fast as before.
- The request budget is bounded: one runs read and at most 4 jobs reads, each
  keeping the existing single network/5xx retry. The existing 100-request
  headroom check runs on every read.
- The new route is narrow: one gate type, only after merge, only into delivery
  verification. Approval stays scoped, single-use, and non-transitive.

## Validation

On Node `24.7.0`: `corepack pnpm validate:workflow`, `test`, `build`, and
`git diff --check`. The verifier tests must cover:

- incomplete then complete data passes, with the expected number of reads;
- always-incomplete data fails after 4 jobs reads with the observed-state
  message;
- `null` conclusions are retried the same way as missing steps;
- skipped, failed, and duplicated steps fail after 1 jobs read, with no wait;
- an incomplete read followed by a failed read fails immediately;
- the existing network, 5xx, auth, rate-limit, and pagination behavior is
  unchanged.

Delivery verification for this work item exercises the new verifier in
production pre-deploy for its own merge commit.

## Rollback

Revert the merge commit and redeploy through the normal pipeline. No data or
configuration changes are involved.

## Implementation slice

### `bounded-step-reread-and-retry-gate`

This is the only and final slice. It implements both parts above, together with
their tests, the delivery-verification skill instruction, and the operations
note.

Acceptance criteria:

- the verifier re-reads only incomplete step data, at most 4 jobs reads 15
  seconds apart, and reports the observed state when reads are exhausted;
- explicit failures, config errors, and existing retry behavior are unchanged,
  and all verifier tests pass without real delays;
- the validator accepts a post-merge `production_mutation_approval` routing to
  `delivery_verification / retry-delivery-<id>` and rejects the two misroutes;
- the delivery-verification skill and the operations doc describe the new
  behavior;
- all listed validation passes, with no CI, Railway, credential, or database
  change.
