# Process Simplification

## Decision

On 2026-09-30 the repository owner replaced the v3/v3.1 work-item orchestration
with a thin, PR-based process. The owner approved the direction in the session
after reviewing the evidence below. This change is itself delivered under the
new process: one PR, one independent review, and the owner's merge approval.

## Evidence

- Lessons, the product, received about 9% of Codex tokens between 2026-09-09
  and 2026-09-30. Infrastructure took about 70%, and the orchestration process
  itself about 19%. Five of eleven work items changed the process.
- Process artifacts were 1.28 MB against 263 KB of application code.
- A retry of about 150 lines (`delivery-retry-hardening`) needed 6
  design-review rounds, 2 implementation reviews, and about 30 commits. Most
  findings concerned encoding actions in the YAML state machine, not the
  delivery problem.
- The parts that caught real defects were the independent review, CI with
  branch protection and the exact-SHA pre-deploy verifier, the owner's
  merge/production approvals, and the lesson design before code.

## New process

Binding rules live in `AGENTS.md`, and the skills are `design`, `review`, and
`delivery-verification`.

1. Every change: a branch from fresh `main`, one PR, green CI, one independent
   review, the owner's merge approval, and a delivery check after merge.
2. Lessons and risky changes (auth, persistence, migrations, deployment,
   production, credentials, CI, and this process) start with a short design
   and one independent design review. The owner approves the design before
   code.
3. Production mutations (redeploy, restart, rollback, migration retry,
   variables, secrets) run only after an explicit owner approval that names the
   exact target and command. A redeploy retry also requires
   `delivery:retry-guard --mode pre` to clear, and `--mode post` after it.
4. The PR (draft or ready, checks, review) plus the design and review files
   hold the state. Nothing else does.

## What is removed

- The workflow state machine, `docs/workflow/*.yaml`, and its templates. They
  are archived unchanged in `docs/archive/workflow/` as history.
- `scripts/validate-workflow-contract.mjs`, the `validate:workflow` script,
  and its CI step.
- Orchestration skills: `work-orchestrator` (and its contract),
  `lesson-orchestrator`, `work-design`, `design-review`,
  `implementation-slice`, `implementation-review`, `targeted-fix`,
  `targeted-rereview`, and `reconciliation`.
- Five role profiles. `implementer` and a new `reviewer` remain.
- Lifecycle generations, annotated lifecycle tags, bootstrap anchors, typed gate
  scopes, reconciliation contracts, and immutable per-round review files.

## What is kept

- CI (`Validate`), branch protection, the exact-SHA verifier with its bounded
  step re-read, and Railway Wait-for-CI.
- `pnpm evidence:delivery`, `pnpm delivery:retry-guard`, and
  `pnpm smoke:production`.
- The context budget and the output discipline in `AGENTS.md`.
- All designs, reviews, operations documents, and evidence as history.

## Migration

- Existing lifecycle tags and retained `work/*` branches stay as history. No
  deletion is needed.
- The in-flight Lesson 2 work item (`work/stage-01-lesson-02-frequency-pitch`,
  PR 20) continues under the new process. After this merges, its branch takes
  `main`, drops its workflow YAML, and keeps its design.

## Validation

`corepack pnpm test`, `corepack pnpm build`, and `git diff --check`. The
foundation acceptance test drops only the `validate:workflow` step assertion,
and every other CI invariant stays. CI passes on the PR, and delivery is
checked with `evidence:delivery` after merge.

## Rollback

Revert the merge commit. The archived workflow files and git history hold the
previous process intact.
