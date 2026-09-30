# Orchestration Usage Optimization

## Goal

Reduce Codex subscription usage and context growth during repository-local work
orchestration while preserving every v3.1 identity, review, approval, delivery,
and fail-closed guarantee.

The optimization targets the demonstrated sources of avoidable usage:

- a gate approval can currently begin a long automatic run through newly
  authorized phases;
- provider commands can return much more JSON or log text than the decision
  requires;
- review profiles use `high` reasoning for every review regardless of their
  already narrow, deterministic scope.

## Baseline and profile boundary

The personal Codex profile uses `gpt-5.6-sol` with `medium` reasoning. The
corporate profile's Astra selection is a separate configuration boundary. This
work item does not modify either profile and does not add a repository override
for the root model.

Repository agent profiles remain on their existing model families. Designer
and implementation profiles remain at `medium`, and the targeted fixer remains
at `low`. The three review profiles move from unconditional `high` to `medium`.
This reduces routine review usage without selecting an unverified model or
weakening the required review dimensions and verdict contract.

## Scope

### Human-gate execution boundary

An invocation that supplies approval for the workflow's current human gate
must consume exactly that gate, persist and publish the resulting workflow
transition, report the newly authorized action, and stop. The newly authorized
phase is not dispatched in the same invocation.

Approval remains scoped, single-use, and non-transitive. A user may explicitly
request both the exact current approval and continued execution, but the
orchestrator must treat that as a separate opt-in and still stop at the next
human or typed operational gate. A generic approval request does not imply this
opt-in.

~~Automatic continuation remains available when an invocation starts on a
ready non-human phase.~~ *Superseded by Amendment 01: each invocation executes
one phase unless the user explicitly asks to continue.* Existing fingerprint
checks and all other stop conditions remain unchanged.

### Bounded command and provider output

The orchestrator and delivery verification instructions must make model-visible
output proportional to the decision being made:

- use source-side field selection when the provider supports it;
- use exact IDs, SHA filters, bounded time windows, result limits, and log-line
  limits;
- project JSON to the required scalar fields before returning it to the model;
- select only relevant lifecycle events from logs;
- never print environment-variable collections, credentials, tokens, or
  unredacted provider configuration;
- escalate from a narrow query only when a required fact is still missing, and
  fetch the smallest additional field set;
- summarize evidence in the immutable artifact instead of copying raw provider
  responses.

For Railway specifically, delivery verification must prefer a narrow GraphQL
selection or a bounded CLI result filtered before model output. It must retrieve
only the fields needed for the current proof, such as deployment ID, status,
source repository and branch, commit SHA, creation/update timestamps, image
digest, and the small set of relevant log events. Broad deployment/configuration
JSON and complete build or runtime logs are forbidden by default.

Detailed Railway retrieval guidance belongs in a delivery-verification
reference loaded only during Railway evidence collection, keeping the common
skill entrypoint small.

### Contract validation

The repository workflow validator must stop asserting the previous unconditional
same-invocation continuation wording and assert the new boundary instead:

- ~~ordinary non-human completion can continue after fresh preflight~~
  (superseded by Amendment 01: it stops unless continuation was requested);
- gate consumption stops after its committed and published transition;
- only an explicit approval-and-continue request permits immediate dispatch;
- approval still cannot cross a later gate;
- output guidance requires bounded, filtered Railway evidence retrieval.

Tests should validate behavioral invariants rather than an entire prose block.

## Non-goals

- Changing `~/.codex/config.toml`, `.codex-personal/config.toml`, subscription
  settings, or the corporate Astra profile.
- Changing application code, course content, CI behavior, Railway resources,
  credentials, database state, or production state.
- Removing design, review, implementation, fix, merge, delivery, or completion
  phases.
- Reusing approvals, skipping reviews, weakening lifecycle identity checks, or
  weakening delivery evidence.
- Rewriting `AGENTS.md` broadly. Its always-loaded contract can be evaluated in
  a later work item after usage from these lower-risk changes is measured.
- Adding a dependency or a new orchestration service.

## Architecture and affected artifacts

The change is repository-control-plane only:

- `.codex/skills/work-orchestrator/SKILL.md` owns approval consumption and
  automatic-continuation semantics;
- `.codex/skills/delivery-verification/SKILL.md` owns the concise evidence
  policy and routes Railway work to a conditional reference;
- `.codex/skills/delivery-verification/references/railway-evidence.md` owns
  provider-specific field-selection and bounded-output guidance;
- `.codex/agents/plan-reviewer.toml`,
  `.codex/agents/implementation-reviewer.toml`, and
  `.codex/agents/fix-reviewer.toml` own repository review effort;
- `scripts/validate-workflow-contract.mjs` verifies the updated contract.

No runtime bundle, API, persistence model, deployment configuration, or user
experience changes.

## Safety and compatibility

The approval boundary changes only when execution happens, not which state is
legal. Existing v1/v2/v3/v3.1 workflow files and terminal history remain valid.
Every phase skill still owns its complete transition, and every transition must
still be committed and published on the canonical branch.

If publishing the consumed gate transition fails, the invocation reports the
failure and does not dispatch the newly authorized phase. If a user combines
approval and continuation, the orchestrator re-resolves the published state and
runs full preflight before dispatch exactly as it does for other continuations.

Provider filtering must never turn missing evidence into success. A narrow
query that omits a required fact must fail closed or obtain that exact missing
fact with another narrow query. Raw evidence may remain available at the
provider; it is simply not copied wholesale into model context or repository
artifacts.

## Validation strategy

Run with Node `24.7.0`:

- `corepack pnpm validate:workflow`;
- `corepack pnpm lint`;
- `corepack pnpm test`;
- `corepack pnpm build`;
- `git diff --check`;
- the `skill-creator` quick validator for each changed skill.

Static contract assertions must cover the new gate stop rule, explicit opt-in,
non-transitive approval, bounded Railway retrieval, and the Amendment 01
one-phase invocation boundary. Review the final diff to prove that
no personal/corporate profile, application, deployment, or provider artifact
changed.

## Rollback

Rollback is a normal repository revert before merge. After merge, revert the
single implementation commit and run the same validation. No data or provider
rollback is required because the change has no application or infrastructure
side effects.

## Implementation slice

### `bounded-orchestration-execution`

This is the only and final slice.

Implement the human-gate stop boundary, explicit approval-and-continue opt-in,
bounded output guidance, conditional Railway evidence reference, reviewer
effort changes, and matching workflow-contract assertions. Preserve all other
orchestration, lifecycle, review, and delivery behavior.

Acceptance criteria:

- a plain gate approval transitions and publishes state, reports the next
  action, and stops before dispatching it;
- an explicit approval-and-continue request may proceed after a fresh preflight
  but cannot reuse approval at a later gate;
- ~~an invocation starting at a ready non-human phase retains deterministic
  automatic continuation and fingerprint protection~~ (superseded by the
  amended acceptance criteria in Amendment 01);
- Railway evidence collection requests and exposes only the minimum required
  fields and bounded relevant logs, with secrets excluded;
- review profiles use `gpt-5.6-sol` with `medium` reasoning while implementer,
  fixer, personal, and corporate profile choices remain unchanged;
- all listed validation passes without dependency, application, CI,
  infrastructure, credential, or provider changes.

## Amendment 01: measured audit (2026-09-30)

The repository owner explicitly approved this amendment on 2026-09-30 after an
audit of 153 personal Codex session logs (2026-09-09 to 2026-09-30). The
amendment supersedes the parts of this design listed below. Everything else
stays in force.

### Evidence

- 528M input tokens (95% cached) against 2.7M output tokens, so usage tracks
  context size times call count, not reasoning effort.
- The baseline is about 22K tokens per call. The average call carried 100–146K,
  and 57% of all input came from calls whose context exceeded 100K. Threads
  that kept continuing grew to 236K. That contradicts the assumption above that
  automatic continuation saves usage.
- Tool output was about 78% of input. Whole-document reads were about 50% of
  resident context, and git diff/log/show about 16%. Agents read historical
  workflows and reviews as examples.
- `AGENTS.md` (11.6 KB) was resent in every call, even though about 75% of it
  applied only to orchestrated phases.
- Lessons received about 9% of tokens. Infrastructure took about 71%, and the
  orchestration process itself about 19%.

### Superseded decisions

- **Invocation boundary.** Each invocation now executes at most one phase,
  publishes its transition, reports the next launcher prompt, and stops. The
  next phase starts in a fresh session. Continuation within one invocation
  requires an explicit user request; at a human gate it needs both that exact
  approval and the continuation request. Fingerprint checks, stop conditions,
  and non-transitive approval stay as they were.
- **`AGENTS.md` scope.** The non-goal "Rewriting `AGENTS.md` broadly" is
  withdrawn. The orchestration sections move verbatim to
  `.codex/skills/work-orchestrator/references/contract.md`. Every phase skill
  reads that file, so no invariant is dropped. `AGENTS.md` keeps project rules
  and gains a context budget and a work-track choice. The validator caps it at
  5000 bytes.
- **Lite track.** Small, low-risk changes (copy, styling, docs, tooling, or a
  contained fix of about 300 lines or less, with no auth, persistence,
  migration, deployment, production, credential, or provider change) use one
  branch, one session, and one PR, with no workflow state or review artifacts.
  Lessons and risky work keep the full v3.1 route.
- **Read scope and output discipline.** Phases read only the current work
  item's workflow, design sections, latest review, and named `context`, and
  they use templates for formats. Commands locate before reading and bound
  their diffs and logs.
- **Artifact size.** Designs target about 6 KB for maintenance/refactor, 15 KB
  for technical_feature/infrastructure, and 20 KB for lessons. Review artifacts
  target about 3 KB and contain findings only.
- **Delivery evidence command.** Railway output was ~775K tokens across 559
  calls, and only ~5% of it was projected. `deployment list --json` alone
  returns 48 KB, and a build log returns about 81 KB. The new
  `corepack pnpm evidence:delivery --sha <sha>` (`scripts/railway-delivery-evidence.mjs`)
  runs with the pinned production IDs. It processes provider JSON and logs
  locally and prints only the contract facts (about 1.3 KB). Any expected fact
  that is absent is reported as `MISSING` and exits 1. `railway-evidence.md`
  makes it the default and forbids `whoami`/`status`/schema/`--help`
  preflights and loading the external `use-railway` skill for delivery.
- **Search scope.** `.rgignore` hides immutable reviews, delivery evidence,
  completed operation plans/evidence, and completed items' workflows and
  process designs from default `rg`. Nothing moves: completed workflows keep
  their paths, and explicit paths remain searchable.
- **Contract validation.** Instruction checks now match short invariant phrases
  after whitespace normalization, instead of exact wrapped prose. The dispatch
  model asserts the new boundary.

### Outside the repository

The owner applied these changes to the personal Codex profile separately:
removed `service_tier = "priority"`, which roughly doubled weekly-limit usage
per token; added `model_auto_compact_token_limit` and `tool_output_token_limit`;
disabled the retired Cloudflare plugin; and replaced one-off approval rules with
general read-only and validation rules.

### Amended acceptance criteria

These replace the automatic-continuation criterion above:

- a successful non-human phase publishes its transition, reports the next
  launcher prompt, and stops unless the user explicitly asked to continue;
- explicit continuation keeps fresh preflight, fingerprint protection, and
  every gate stop;
- `AGENTS.md` is at most 5000 bytes and points orchestrated work to the
  contract reference, which retains the moved invariants verbatim;
- phase skills name their exact read sets and artifact size targets;
- `evidence:delivery` reproduces the recorded facts of the last delivery and
  fails closed for an unknown SHA;
- the lite track excludes control-plane, CI, server, and operations paths, and
  a fresh-session merge approval must name the full presented head SHA;
- `corepack pnpm validate:workflow`, `test`, `build`, and `git diff --check`
  pass with no application, CI, infrastructure, credential, or provider change.
