# Delivery Retry Hardening

## Goal

This work item reduces the two delivery problems exposed on 2026-09-30 by the
`orchestration-usage-optimization` delivery. The evidence is in
`docs/delivery-evidence/orchestration-usage-optimization/delivery-01.md` on the
retained branch `work/orchestration-usage-optimization`.

1. **Transient step data fails a correct deploy.**
   - Deployment `b68b1759…` for `732e2bb…` failed pre-deploy with
     `Required validation step did not succeed: Install dependencies.`
   - Push run `36725741099` and all six required steps had succeeded. CI ran
     from 13:59:46Z to 14:01:00Z, and the verifier failed at 14:03:11Z, 131 s
     after CI completed.
   - The same built verifier passed later, sometime between about 14:04Z and
     14:14Z (the exact time was not recorded). The redeploy at 14:14:31Z also
     passed.
   - GitHub therefore served incomplete job-step data for more than 131 s and
     less than about 13 minutes.
2. **The delivery retry has no legal workflow state.** The validator routes
   every non-merge, non-completion gate to `implementation` and requires
   `reviewed_sha: null` outside a few named after-merge states. The approved
   redeploy could only be recorded in the evidence artifact.

## Non-goals

- Retrying anything other than incomplete step data. The existing single
  network/5xx retry stays. Auth, rate-limit, pagination, redirect,
  malformed-response, wrong-run, and explicit step failures stay immediate.
- Changing which run, job, or steps are required, or the bypass semantics.
- Changing CI, Railway configuration, variables, credentials, or the database.
- Letting any other gate route to delivery verification, or letting a
  post-merge production gate route anywhere else.
- Guaranteeing that every GitHub inconsistency heals in time. The re-read is a
  bounded mitigation, and the post-merge production gate is the documented
  fallback.

## Verifier: bounded, observable re-read

`verifyCi` keeps its run lookup unchanged. For the single matching run, the
jobs endpoint must return one `validate` job with `status: completed` and
`conclusion: success`. The first such read pins `job.id`. Each required step is
then classified:

- **passed:** exactly one step with that name and `conclusion: "success"`;
- **incomplete:** no step with that name, or exactly one with
  `conclusion: null`;
- **failed:** duplicated, or any other conclusion (`skipped`, `failure`,
  `cancelled`, …). The runner has already finalized these, and they do not
  change between reads.

Rules:

- A failed step fails immediately, with no wait.
- If a step is incomplete and none has failed, wait and re-read only the
  jobs endpoint of the same run.
- Reads happen at 0, 15, 45, 105, and 225 s: 5 jobs reads in total, with
  waits of 15, 30, 60, and 120 s. In the incident this reaches about 356 s
  after CI completed.
- Every re-read passes the same request, metadata, rate-limit, parsing,
  single-job, and job-conclusion checks, and must return the pinned `job.id`.
  A different job, for example after a manual rerun under `filter=latest`,
  fails as `validate job identity changed`.
- Success requires all six steps to pass in a single read. Reads are never
  combined.
- Every re-read logs one line: the observed state and the next wait, for
  example `CI step data incomplete: Install dependencies (missing); re-reading
  in 30 s (read 2/5).` The next incident then records how long it lasted.

Every step failure keeps the existing prefix and adds what was observed, with
no secrets:

- `Required validation step did not succeed: Install dependencies (missing after 5 job reads).`
- `… Browser regression tests (conclusion skipped).`
- `… Lint and typecheck (duplicated).`

Budget:

- one runs read plus at most 5 jobs reads;
- each read keeps the single network/5xx retry, so at most 12 HTTP requests
  per verification, against at most 4 today;
- at most 225 s of waits, and about 305 s of worst-case extra wall time,
  including request timeouts.

The waits happen only while data is incomplete, so the success path and
explicit failures are unaffected. Railway sets no pre-deploy timeout. The wait
is injected (`verifyCi(environment, fetch, wait)`, defaulting to a real timer),
so tests run without delays.

## Workflow contract: post-merge production retry gate

A v3.1 `human_gate / production_mutation_approval` with a non-null
`git.merged_sha` is a **post-merge production gate**. `validateState` enforces:

- it counts as after-merge, so `merged_sha` and a full `reviewed_sha` are
  required;
- `gate_scope.merged_sha === git.merged_sha`, in addition to the existing
  provider, environment, targets, operation or plan, and stop-condition checks;
- `next.on_approval` is `delivery_verification` with
  `retry-delivery-<NN>`, where `NN` is two digits.

Before merge the existing rule is unchanged: routing to `implementation` with
`implement-` or `resume-`.

`validateTransition` enforces:

- a post-merge production gate is entered only from `delivery_verification`;
- it leaves only to its `next.on_approval`, or through the owner's withdrawal
  to `delivery_verification / verify-delivery`;
- `git.reviewed_sha` and `git.merged_sha` stay unchanged across every
  transition into and out of the gate.

`NN` is the sequence number of post-merge production retries for the work
item, starting at `01`. One gate authorizes exactly one retry.

Consumption semantics, mirroring `merge_approval`:

1. When the gate is used, re-resolve the workflow and scope, and re-check the
   pinned stop conditions against live provider state.
2. Run the retry guard with `--mode pre` as the last read before the
   operation. No other read or step happens between it and the operation.
3. Perform the pinned operation exactly once. Issuing it consumes the gate,
   whatever the outcome.
4. Run the guard with `--mode post` and the new deployment ID from the
   operation's output.
5. Always leave the gate:
   - if the post-check clears, enter `delivery_verification / ready /
     retry-delivery-<NN>`;
   - if it stops, or the output has no deployment ID, enter
     `delivery_verification / blocked / supply-retry-<NN>-owner-decision`.
     This is a possible rollback: the owner decides, and no further mutation
     happens.

`retry-delivery-<NN>` is a read-only re-verification. It runs
`--mode post` without an ID before collecting evidence, and a stop blocks the
same way. Any further mutation needs a new gate with the next `NN`. The
delivery evidence records each retry with its scope, operation, deployment ID,
guard results, and outcome.

Guard stops before the operation:

- **temporary** (`deployment in progress`, or a missing or failed provider
  fact): leave the gate unconsumed and re-run the guard later;
- **permanent** (`main advanced`, a newer deployment, already `SUCCESS`): the
  owner withdraws the gate. Withdrawal is legal only if no operation was
  issued. The state returns to
  `delivery_verification / verify-delivery` with unchanged SHAs, the evidence
  records the guard's reason, and no mutation happens. How delivery of a
  superseded `merged_sha` is then proven is the owner's decision, outside this
  contract.

The same rules are stated in the `production_mutation_approval` bullet of
`.codex/skills/work-orchestrator/SKILL.md`. In
`.codex/skills/delivery-verification/SKILL.md`, the sentence at lines 12–13
("read-only unless `next.action` records a bounded safe retry or a separate
typed production gate authorizes mutation") is replaced. Delivery verification
is read-only at `verify-delivery` and `retry-delivery-<NN>`. The only
production mutation is the single pinned operation performed while
`production_mutation_approval` is being used. The validator pins this wording
with `requirePhrases`. `docs/operations/railway-ci-cd.md` documents the re-read
schedule, the budget, and the fallback.

### Retry guard

A redeploy of `merged_sha` must never roll production back after newer code
has been merged or deployed.

`scripts/delivery-retry-guard.mjs`, run as
`corepack pnpm delivery:retry-guard --mode pre|post --sha <merged_sha> [--retry-deployment <id>]`,
is read-only. It reads the protected `main` head from GitHub and the unfiltered
deployment list of the pinned production web service from Railway, and prints
one line. The CLI body runs only under `import.meta.main`, and
`scripts/delivery-retry-guard.d.mts` types the export for the test.

The pure, exported `retryGuardDecision({ mode, sha, mainSha, deployments, retryDeploymentId })`,
where `mode` is `"pre"` or `"post"` and is always explicit:

- takes the newest deployment by greatest `createdAt`, never by commit, and
  stops on an empty list or a missing timestamp;
- **pre** rejects a `retryDeploymentId`. It clears only if `mainSha === sha`,
  the newest deployment is for `sha`, and its status is `FAILED` or `CRASHED`;
- **post** takes an optional ID. It clears only if `mainSha === sha` and the
  newest deployment is for `sha` (any status), and, when an ID is given, it is
  that retry deployment;
- otherwise stops with a reason that states the observed facts (`main advanced
  to <sha>`, `newer deployment <id> for <sha>`, `latest deployment already
  SUCCESS`, `deployment <status>`, `missing <fact>`) and says whether the stop
  is temporary or permanent.

For a post-merge production gate, `validateState` requires `stop_conditions`
to name `delivery:retry-guard`: a string stop condition must contain it, and in
a list form at least one entry must contain it. The skills pin the command
with `requirePhrases`.

A window of a few seconds remains between the pre-check read and Railway
accepting the redeploy. The post-check detects a rollback in that window, and
the owner decides the recovery.

## Safety

- The re-read can only delay a decision. Missing or contradictory evidence can
  never become success.
- Explicit failures never wait. A renamed or removed required step fails after
  the full window instead of at once, and still fails.
- Pinning the job identity prevents evidence substitution across attempts.
- The new route is narrow: one gate type, only after merge, only from and to
  delivery verification, pinned to the merged SHA, with one mutation per
  approval.
- The guard blocks a redeploy that would replace newer code, or that retries a
  deployment that already succeeded or is still running. Its post-check
  surfaces the remaining race.

## Validation

On Node `24.7.0`: `corepack pnpm validate:workflow`, `test`, `build`, and
`git diff --check`.

Verifier tests:

- incomplete then complete data passes, with the exact waits;
- always-incomplete data makes 5 jobs reads with waits `[15, 30, 60, 120]` s,
  one log line per re-read, and the `(missing after 5 job reads)` message;
- a `null` conclusion is handled like a missing step;
- skipped, failed, and duplicated steps make 1 read and no wait, and the error
  carries the observed-state suffix;
- an incomplete read followed by a failed read fails immediately;
- a changed `job.id` on a re-read fails;
- always-incomplete data with a 5xx on every jobs read stays within 12 fetch
  calls;
- the existing network, 5xx, auth, rate-limit, and pagination tests are
  unchanged.

Retry guard tests (`build/delivery-retry-guard.test.ts`, pure decision):

- the pre-check clears for a newest FAILED or CRASHED deployment of `sha` with
  `main` at `sha`;
- it stops when `main` advanced, when a newer deployment for another SHA sits
  next to an older FAILED one for `sha`, when the deployment already
  succeeded, when it is in progress, and on an empty list or a missing
  `createdAt`;
- the pre-check rejects a `retryDeploymentId`;
- the post-check clears, with or without the ID, for a newest SUCCESS or
  FAILED deployment of `sha` with `main` at `sha`. It stops when a newer
  deployment for another SHA or an advanced `main` appears, and when the given
  ID is not the newest;
- stops are labeled temporary or permanent as specified.

Validator fixtures:

- **legal:** a post-merge gate routing to
  `delivery_verification / retry-delivery-01`;
- **legal:** a `retry-delivery-01` state;
- **illegal:**
  - the post-merge gate routing to `implementation`;
  - a pre-merge gate routing to `delivery_verification`;
  - a post-merge gate with `reviewed_sha: null`;
  - a mismatched `gate_scope.merged_sha`;
  - a post-merge gate whose `stop_conditions` omit `delivery:retry-guard`;
- **transition chain:** `delivery_verification` → gate →
  `retry-delivery-01` → `work_item_completion` passes;
- **withdrawal:** gate → `delivery_verification / verify-delivery` with the
  same SHAs passes;
- both fail when a SHA changes. Entry from `implementation` fails with the
  from-phase error message;
- **illegal withdrawals:** a `work_item_completion` gate →
  `verify-delivery`, and a pre-merge production gate → `verify-delivery`;
- **legal:** a `delivery_verification / blocked /
  supply-retry-01-owner-decision` state.

This work item's own production delivery exercises only the first-read path.
The re-read path is proven by tests.

## Rollback

Revert the merge commit and redeploy through the normal pipeline. No data or
configuration changes are involved.

## Implementation slice

### `bounded-step-reread-and-retry-gate`

This is the only and final slice. It implements both parts above and the retry
guard (script, `.d.mts`, and the `delivery:retry-guard` script in
`package.json`), with their tests, the two skill instructions, and the
operations note.

Acceptance criteria:

- the verifier re-reads only incomplete step data, following the stated
  schedule and budget with the job ID pinned, logs each re-read, and reports
  the observed state on every step failure;
- explicit failures, config errors, and the existing retry behavior are
  unchanged, and the tests run without real delays;
- the validator enforces the post-merge production gate rules, including the
  required retry guard, and the transition SHA continuity, with the listed
  fixtures;
- `delivery:retry-guard` is read-only. Its pre-check clears only when `main`
  and the newest (by `createdAt`) FAILED or CRASHED deployment are at
  `merged_sha`. Its post-check runs after the operation and in
  `retry-delivery-<NN>`, and both modes are explicit. Issuing the operation
  consumes the gate, and a stopped post-check blocks for the owner. Permanent
  stops exit only through the owner's withdrawal before any operation, as
  proven by the guard tests and fixtures, and the skills pin this wording;
- the skills and the operations doc describe the behavior and the fallback;
- all listed validation passes, with no CI, Railway, credential, or database
  change.
