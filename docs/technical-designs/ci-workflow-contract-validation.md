# CI workflow contract validation

## Purpose

Make the repository workflow contract validator an explicit part of the normal
GitHub `Validate` job so an invalid orchestration/control-plane state cannot
pass otherwise-green application validation.

The existing `pnpm validate:workflow` command and validator behavior are the
contract being integrated. This work does not redesign either the CI pipeline
or the validator.

## Goals

- Run `pnpm validate:workflow` on every pull request and every push to `main`
  through the existing `Validate` workflow.
- Make validator failure fail the existing `validate` job and therefore the
  existing required `Validate / validate` check.
- Run the check early enough to stop expensive application, browser, database,
  and build work when the workflow contract is invalid.
- Preserve the current CI triggers, job identity, service topology, application
  checks, and production-delivery contract.

## Non-goals

- Changing workflow-validator parsing, validation rules, fixtures, output, or
  exit behavior unless implementation uncovers a real compatibility defect.
- Renaming or splitting the `validate` job, adding a workflow, changing
  branch-protection settings, or otherwise redesigning CI.
- Changing Railway configuration, pre-deploy verification, deployment
  sequencing, migrations, readiness, or smoke behavior.
- Adding dependencies, secrets, caches, service containers, or setup actions.
- Unrelated workflow, application, test, or documentation cleanup.

## Current contract and compatibility

`.github/workflows/ci.yml` has one `validate` job. It checks out the repository,
sets up pnpm 11.9.0 and the Node version from `.nvmrc`, installs the frozen
lockfile, then runs lint/typecheck, unit tests, browser tests, PostgreSQL
integration tests, and the production build.

`package.json` already defines:

```text
validate:workflow = node scripts/validate-workflow-contract.mjs
```

The validator imports only Node built-ins and reads repository files. Its
contract checks and fixtures execute inside that script. It does not require a
database, browser, network, secret, environment variable, generated artifact,
or third-party runtime package. The command therefore has all required runtime
support once the existing Node and pnpm setup has completed; no dependency or
lockfile change is needed.

The production exact-SHA verifier in `server/verify-ci.ts` already requires a
successful completed `Validate` workflow run and successful `validate` job.
Consequently, a failed workflow-contract step prevents the run and job success
that Railway accepts. The verifier additionally checks a stable subset of the
existing application steps and permits extra successful steps, so neither it
nor its tests need to change. Keeping its required-step list unchanged avoids
altering Railway behavior while preserving the stronger overall CI gate.

## CI placement and ordering

Add one explicit step to the existing `validate` job:

```yaml
- name: Validate workflow contracts
  run: pnpm validate:workflow
```

Place it immediately after `Install dependencies` and immediately before
`Lint and typecheck`. The resulting conceptual order is:

```text
checkout
→ pnpm setup
→ Node setup
→ frozen install
→ workflow contract validation
→ lint/typecheck
→ unit tests
→ browser tests
→ PostgreSQL integration tests
→ production build
```

Running after installation keeps every repository command behind the existing
single dependency/bootstrap boundary and uses the same configured Node/pnpm
environment as the rest of the job. Running before lint/typecheck prioritizes
the fast control-plane check and avoids spending CI time on downstream checks
when orchestration state is invalid.

Do not add `continue-on-error`, conditions, retries, or failure suppression.
The command's nonzero exit must fail the step, stop later steps under GitHub
Actions' default success condition, and fail the existing job/check. Success
must leave all later validation behavior unchanged.

## Test and documentation impact

Extend the existing CI-focused assertion in
`build/foundation.acceptance.test.ts` to prove that:

- `.github/workflows/ci.yml` invokes `pnpm validate:workflow` exactly once; and
- that invocation appears after `pnpm install --frozen-lockfile` and before
  `pnpm lint`.

This is the existing test boundary for validation-only workflow invariants, so
no new test file or framework is warranted. The validator's own contract
fixtures already exercise its behavior and require no changes. The exact-SHA
Railway verifier tests also require no changes because the verifier continues
to accept extra steps and still rejects any unsuccessful job.

No README, operator runbook, or deployment documentation needs an update. The
CI YAML is the executable pipeline source, while this design and workflow state
provide the durable rationale and orchestration record.

## Infrastructure, security, and operations

- **Topology and environments:** retain the single GitHub-hosted `validate` job
  and its existing PostgreSQL service. No environment is added or changed.
- **Secrets and permissions:** retain `contents: read`; the validator needs no
  token, secret, write permission, or external service.
- **Deployment semantics:** retain the workflow triggers, job/check identity,
  Railway Wait for CI behavior, exact-SHA pre-deploy verifier, migration order,
  startup, readiness, and smoke checks.
- **Observability:** GitHub exposes the named step and its existing validator
  stdout/stderr in the job log. No additional telemetry is needed.
- **Cost and limits:** the validator is a local Node process and runs before
  expensive test/build stages. It adds negligible runner time and no service
  or storage cost.
- **Failure mode:** invalid workflow state or a validator process error fails
  closed as a red `Validate / validate` check. A GitHub runner outage remains a
  CI availability issue and does not justify bypassing the step.

## Acceptance criteria

1. The existing `validate` job contains exactly one step named
   `Validate workflow contracts` whose command is exactly
   `pnpm validate:workflow`.
2. The step is after the frozen dependency install and before lint/typecheck.
3. The step has no condition, retry, or `continue-on-error` behavior and a
   nonzero validator exit fails the existing job/check.
4. Existing triggers, permissions, job name, PostgreSQL service, application
   validation steps, and production build step remain unchanged.
5. `package.json`, the lockfile, validator implementation, Railway
   configuration, exact-SHA verifier, and verifier tests remain unchanged
   unless review confirms a concrete compatibility defect first.
6. The existing foundation acceptance test covers presence, uniqueness, and
   ordering of the command.
7. `pnpm validate:workflow`, `pnpm lint`, `pnpm test`,
   `pnpm test:browser`, `pnpm test:postgres`, `pnpm build`, and
   `git diff --check` pass under the repository's configured Node version.

## Rollback

Before merge, revert the two scoped implementation edits in the work-item PR.
After merge, a normal reviewed revert of the CI step and its matching acceptance
assertion restores the prior pipeline. No data, credential, provider, Railway,
or database rollback is involved.

## Approved implementation slice

1. **`ci-required-workflow-validation` — require workflow-contract validation
   in GitHub CI.** Add the one named step to `.github/workflows/ci.yml` at the
   specified position and extend `build/foundation.acceptance.test.ts` with the
   focused presence/uniqueness/ordering assertions. Do not modify validator or
   Railway behavior. Run the full acceptance command set above and record the
   result in workflow state before implementation review.
