# 🎸 Гітара з нуля

Інтерактивний курс для вивчення класичної шестиструнної гітари з нуля.

## Stack

- React 19
- TypeScript
- Vite
- Tailwind CSS v4
- Untitled UI React ecosystem / React Aria
- pnpm
- Railway Node.js + PostgreSQL

## Local development

```bash
pnpm install
docker compose up -d postgres
cp .env.example .env.local # then fill local values
pnpm db:migrate
pnpm dev:server
pnpm dev
```

Vite serves the frontend and proxies `/api` to the local Node service on port
3000. The checked-in Compose service owns only PostgreSQL; the API stays a
normal debuggable Node process.

Production build and server:

```bash
pnpm build
pnpm start
```

The application has one root-based production artifact. The Railway service
serves the Vite SPA and exposes health/readiness plus
registration, login, logout, session restoration, and password-confirmed
account deletion under `/api/v1`. It also exposes authenticated profile and
versioned lesson-progress routes with optimistic revision conflicts.

Preview production build:

```bash
pnpm preview
```

Repository validation:

```bash
pnpm lint
pnpm test
pnpm build
TEST_DATABASE_URL=postgresql://guitar_mastering:local-development-only@127.0.0.1:5432/guitar_mastering pnpm test:postgres
```

`pnpm test` includes Node routing/configuration/shutdown tests and builds the
production artifact through the real Vite configuration. `pnpm test:postgres`
is the explicit fresh-PostgreSQL migration, rollback, and concurrency gate.

## Railway

`.railway/railway.ts` configures Railway to build the SPA and server, runs `node-pg-migrate` as a blocking
pre-deploy step, starts the compiled Node service, and probes database readiness
before shifting traffic. Configure
the key-only variables listed in `.env.example` in each Railway environment and
reference the private PostgreSQL `DATABASE_URL`; do not commit their values.

Production release, rollback, backup/restore, monitoring, and cost procedures
are recorded in
[`docs/operations/production-cutover.md`](docs/operations/production-cutover.md).
CI/CD policy, commit-SHA correlation, Railway IaC drift checks, and deployment
failure response are recorded in
[`docs/operations/railway-ci-cd.md`](docs/operations/railway-ci-cd.md).
The approved target pre-deploy command is `pnpm release:predeploy`, which runs
the exact-SHA GitHub Actions verifier before `pnpm db:migrate`. Production must
use a sealed, repository-only `Actions: read` credential and never fall back to
anonymous GitHub API access. The production source, Wait for CI, and autodeploy
are active. The first positive and protected-branch negative proof follows the
reviewed
[`docs/operations/railway-end-to-end-cicd-acceptance-plan.md`](docs/operations/railway-end-to-end-cicd-acceptance-plan.md);
do not change source, gate variables, or branch policy ad hoc.
The data-handling and backup-retention disclosure is in
[`docs/operations/privacy-and-retention.md`](docs/operations/privacy-and-retention.md).

## Contributing and releases

Make repository changes through a pull request. `Validate` must pass for the
pull request and again for the exact commit created on `main`; do not use CI
skip directives, direct pushes, or a manual workflow run as a substitute. Keep
the workflow unconditional and preserve its single `validate` job unless a
reviewed CI/CD design changes those invariants.

GitHub Actions validates code but does not itself apply Railway IaC. A protected
`main` push can trigger Railway only after Wait for CI; Railway then runs the
exact-SHA verifier before its production migration. Infrastructure changes use
a separately reviewed manual `railway config plan` / `railway config apply`
procedure.

## Structure

```text
src/
├── components/   # reusable UI
├── data/         # course data
├── lib/          # utilities
├── pages/        # route-level pages
├── styles/       # global Tailwind/theme
├── App.tsx
└── main.tsx
```

# Codex Orchestration Layer v3.1

The repository uses a deterministic, repo-local workflow for both lesson development and technical work.

The orchestration unit is a **work item**.

Examples:

- `stage-01-lesson-02`
- `feature-auth-persistence`
- `feature-profile`
- `refactor-progress-storage`
- `infra-cloudflare-migration`

Eligible work items created after v3.1 activation on canonical `main` use the
v3.1 contract. Active pre-activation v3 items stay v3 unless an explicit,
separately designed migration proves compatible provenance. Completed v1/v2/v3
workflows remain valid under their original contract and are not migrated
merely for schema consistency.
Historical `lesson_id`, `spec`, and `lesson_completion` fields remain readable.

The complete state-machine, reconciliation, gate, migration, and compatibility
contract is documented in [`docs/workflow/README.md`](docs/workflow/README.md).

## Workflow

`work-item init → design → design review → implementation/review/fixes → merge approval → delivery verification → completion approval`

## Sources of truth

- `AGENTS.md` — project rules, work tracks, and context budget
- `.codex/skills/work-orchestrator/references/contract.md` — orchestration invariants
- `.codex/agents/` — role-specific agent profiles
- `.codex/skills/` — reusable workflow phases
- `docs/course-map/` — curriculum/stage truth
- `docs/lesson-designs/` — lesson specifications
- `docs/technical-designs/` — technical architecture/design artifacts
- `docs/reviews/` — immutable review artifacts
- `docs/workflow/` — deterministic work-item state

For an active work item, its workflow YAML is the only mutable authority for
the current `phase`, `status`, `gate`, active `blocking_findings`, and
`next.action`. Designs own durable decisions and approved slices; reviews are
immutable historical assessments; operator documents own bounded operations
and evidence.

## Work tracks

Small, low-risk changes (copy, styling, `src` UI code, course docs, or a
contained fix of at most about 300 lines) use the lite track: one branch, one
session, one PR, with no workflow YAML, design document, or review artifacts.
`AGENTS.md` is binding for the exclusions: control-plane, CI, `scripts/`,
`server/`, operations, and review paths, plus lessons, auth/persistence,
migrations, deployment, production, and credential work, always use the
orchestrated track below.

## Standard launcher

Start every phase in a fresh Codex session. The orchestrator runs one phase,
publishes its transition, prints the prompt for the next phase, and stops.
Templates live in
[`docs/workflow/templates/launcher-prompt.md`](docs/workflow/templates/launcher-prompt.md).

For a normal phase:

```text
Use the work-orchestrator workflow for <work-item-id>.

Read and validate the current workflow state, execute exactly the next allowed phase, publish its transition, and stop.
```

At a human gate:

```text
Use the work-orchestrator workflow for <work-item-id>.

Approve the current <gate> human gate, publish the transition, and stop.
```

Add `Continue until the next human gate.` only when several tightly coupled
phases should share one session.

## Model policy

- design/planning — Sol / medium
- design review — Sol / medium
- implementation — Terra / medium
- implementation review — Sol / medium
- targeted fixes — Terra / low
- targeted re-review — Sol / medium

Reconciliation is a bounded skill-driven repair rather than a separate general
implementation role.

## Deterministic state

Top-level `phase` in `docs/workflow/*.yaml` selects the legal transition family.
`next.action` is the single action allowed now. Prospective destinations exist
only as `next.on_approval` at a human gate or `next.on_success` during
reconciliation.

Contradictory state fails closed with:

```text
WORKFLOW STATE INCONSISTENT
```

The orchestrator must not guess the intended phase or silently repair the state.
A state-only repair is legal only as a separately requested, bounded operation
when immutable evidence or an unambiguous repository fact already determines
the outcome.

## Reviews and fixes

Review artifacts are immutable snapshots. Actionable findings use stable IDs such as `HIGH-01` or `MEDIUM-03`.

V3 findings also carry one semantic class:

- `design_defect`
- `implementation_defect`
- `documentation_defect`
- `state_sync_defect`

Design and implementation defects retain their full review loops. An exact,
non-behavioral documentation or state repair may use reconciliation when its
basis, allowed paths, forbidden effects, acceptance checks, and destination are
already pinned. Ambiguous meaning or risk fails closed into review.

Targeted fixes operate only on active blocking IDs. Targeted re-review verifies those findings plus direct regressions.

Review verdicts are `APPROVED`, `APPROVED WITH RECONCILIATION`, or
`CHANGES REQUIRED`.

## Human gates

Progression gates remain explicit:

- `design_approval`
- `next_slice_approval`
- `work_item_completion`
- `merge_approval`

Risky operations use scoped gates when applicable:

- `production_mutation_approval`
- `destructive_action_approval`
- `credential_change_approval`

Approval is scoped, non-transitive, and single-use. A changed target, plan,
destroy count, credential scope, or risk invalidates it.

## Completion

Before starting another slice, the orchestrator verifies that the authoritative design actually defines one.

For v3, if the approved slice is final:

`human_gate / work_item_completion → explicit human approval → complete`

Existing historical lesson workflows may retain legacy `lesson_completion`.

For v3.1, a final approved slice enters `merge_approval`. The one Draft PR must
merge through protected `main`, and `delivery_verification` must positively
correlate the exact merged SHA across GitHub CI and Railway before
`work_item_completion` can be offered. The canonical work branch remains the
only executable control plane until the terminal state is committed and pushed.

Canonical terminal state:

```yaml
phase: complete
status: complete
gate: none
blocking_findings: []
next:
  action: none
```

`complete` means the current work item is complete only.
