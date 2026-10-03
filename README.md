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
are active and were proven end to end on 2026-09-26. Do not change the
source, gate variables, or branch policy ad hoc.
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
├── auth/         # AuthProvider unit (auth-provider/)
├── components/   # UI units: base/ (Untitled UI), lesson/, app layout pieces
├── data/         # course data and models (lessons/)
├── hooks/        # shared hooks (use-auth, Untitled UI hooks)
├── pages/        # route-level pages
├── progress/     # lesson progress storage, sync, and hooks
├── providers/    # RouteProvider
├── styles/       # Tailwind theme and globals
├── utils/        # shared helpers (cx, api-error)
├── router.tsx
└── main.tsx
```

Each unit is a kebab-case folder with one responsibility per file
(`unit-name.tsx`, `types.ts`, `constants.ts`, `hooks/`, `utils/`); see
`CLAUDE.md`, "Code structure". Code that is still flat moves in the
component and page steps of `docs/technical-designs/component-structure.md`.

## UI components

The UI uses [Untitled UI React](https://www.untitledui.com/react) (free
components): React Aria Components with Tailwind CSS 4. Components are copied
into `src/components/{base,application,foundations}` by the CLI, pinned at
`untitledui@0.1.69`:

```sh
corepack pnpm dlx untitledui@0.1.69 add <component> -y
```

`components.json` holds the path aliases and `src/styles/theme.css` the design
tokens (our terracotta `brand-*` scale). The project `.mcp.json` registers the
Untitled UI MCP server (approve it once in Claude Code); the `untitled-ui`
skill holds the conventions. Existing lesson components are migrated gradually.

# Working with Claude Code

The binding rules are in `CLAUDE.md`, which Claude Code loads in every
session. Each change is one branch and one PR:

1. **Design** (lessons and risky changes only), using the `design` skill.
2. **Design review** by the `reviewer` subagent or a separate session, using
   the `review` skill.
3. **Owner approves the design.**
4. **Implement** each slice.
5. **Review** by the `reviewer` subagent or a separate session, then fix only
   the reported findings. Only HIGH and MEDIUM findings get a re-review; LOW
   fixes are listed in a `## Fixes` PR comment.
6. **Owner approves the merge** of the exact PR head.
7. **Verify delivery** with the `delivery-verification` skill.

State lives in the PR, including its review comments, and the design. Start
each step in a fresh session (`/clear`).

## Prompts

```text
Design <topic> per CLAUDE.md on branch <type>/<topic>, open a draft PR, and stop.
Review the design of <topic> (PR <n>) with the reviewer agent and stop.
I approve the design of <topic>. Implement slice <slice> on branch <type>/<topic>, push, and stop.
Review PR <n> at its current head with the reviewer agent and stop.
Fix findings <IDs> from the latest review on PR <n>, push, and stop.
I approve merging PR <n> at head <full SHA>. Merge it and verify delivery.
```

## Configuration

- `.claude/skills/`: `design`, `review`, `delivery-verification`.
- `.claude/agents/reviewer.md`: Sonnet / medium effort, no file-editing
  tools, the `review` skill preloaded, own git worktree.
- `.claude/settings.json`: the exact validation commands, the delivery
  evidence and production smoke commands, and read-only `gh pr` commands run
  without a prompt (Claude Code already treats read-only git commands as
  safe). `gh pr merge` and every Railway CLI or MCP call always ask. Pushes to
  `main`, force pushes, and reading `.env` files are denied; these patterns
  are a guard, not a boundary (a bare `git push` from local `main` is not
  matched).
- The main session implements; personal model and plugin choices live in the
  untracked `.claude/settings.local.json`.

## History

Delivered technical designs, the retired v1–v3.1 workflow, and the Codex setup
are kept only in git history, for example
`git log --diff-filter=D --name-only -- docs/`.
