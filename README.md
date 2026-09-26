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

# Codex Orchestration Layer v2.0

The repository uses a deterministic, repo-local workflow for both lesson development and technical work.

The orchestration unit is a **work item**.

Examples:

- `stage-01-lesson-02`
- `feature-auth-persistence`
- `feature-profile`
- `refactor-progress-storage`
- `infra-cloudflare-migration`

Historical `lesson_id` workflows remain supported.

## Workflow

`design → design review → human gate → implementation → implementation review → fixes ↔ fix re-review → human gate → next slice or complete`

## Sources of truth

- `AGENTS.md` — project rules and orchestration invariants
- `.codex/agents/` — role-specific agent profiles
- `.codex/skills/` — reusable workflow phases
- `docs/course-map/` — curriculum/stage truth
- `docs/lesson-designs/` — lesson specifications
- `docs/technical-designs/` — technical architecture/design artifacts
- `docs/reviews/` — immutable review artifacts
- `docs/workflow/` — deterministic work-item state

## Standard launcher

For a normal phase:

```text
Use the work-orchestrator workflow for <work-item-id>.

Read and validate the current workflow state, then execute the next allowed phase.
```

At a human gate:

```text
Use the work-orchestrator workflow for <work-item-id>.

Approve the current human gate, then read and validate the workflow state and execute the next allowed phase.
```

## Model policy

- design/planning — Sol / medium
- design review — Sol / high
- implementation — Terra / medium
- implementation review — Sol / high
- targeted fixes — Terra / low
- targeted re-review — Sol / high

A fresh Codex session per workflow phase is recommended.

## Deterministic state

Top-level `phase` in `docs/workflow/*.yaml` is canonical.

Contradictory state fails closed with:

```text
WORKFLOW STATE INCONSISTENT
```

The orchestrator must not guess the intended phase or silently repair the state.

## Reviews and fixes

Review artifacts are immutable snapshots. Actionable findings use stable IDs such as `HIGH-01` or `MEDIUM-03`.

Targeted fixes operate only on active blocking IDs. Targeted re-review verifies those findings plus direct regressions.

## Completion

Before starting another slice, the orchestrator verifies that the authoritative design actually defines one.

If the approved slice is final:

`human_gate / work_item_completion → explicit human approval → complete`

Existing historical lesson workflows may retain legacy `lesson_completion`.

Canonical terminal state:

```yaml
phase: complete
status: complete
gate: none
blocking_findings: []
next:
  phase: complete
  action: none
  human_approval_required: false
```

`complete` means the current work item is complete only.
