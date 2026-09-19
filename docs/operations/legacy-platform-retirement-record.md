# Legacy platform retirement record

## Authorization and operator

- Work item: `infra-legacy-platform-retirement`; final slice:
  `live-legacy-resource-retirement`.
- Owner approved the exact manifest SHA-256
  `5a59c71645e4be1b93caa70101df7a0c96452fda7146a5b87054602fb735c6ca`
  on 2026-09-19 at `authorize-destructive-live-legacy-resource-retirement`.
- Authenticated operator: GitHub account `olegkirienko`; Cloudflare and Railway
  email `oleg.v.kirienko@gmail.com`.
- Repository-state identity verified before mutation: remote `main` and local
  base commit `d0cd8f56e2a391bf0d2f546711129281999274d9`; tracked binary diff
  SHA-256 `3d0b0c22ab6b632dc9395dbc288ca74f48c59b9a375abc395cf5235380c63b25`;
  sorted untracked content-list SHA-256
  `8d4aeb0f3c40d46408b765f328fffa0c19644a14096215d559b15a2c77ac0724`
  with the workflow/review exclusions recorded in workflow state. The manifest
  file itself rehashed to the exact approved digest.

## Pre-deletion checks

Read-only checks on 2026-09-19 before consuming the gate matched the manifest:

| Target or dependency | Fresh result |
|---|---|
| GitHub Pages | `olegkirienko/guitar-mastering`; `https://olegkirienko.github.io/guitar-mastering/`; build type `workflow`, source `main` `/`, no custom domain, environment `github-pages` ID `21487646710`; public HTTP 200. Fallback tag object `d83f4c881119b52c2456a835a3012173c9d466d0`. |
| GitHub automation/credentials | Only `.github/workflows/ci.yml` (`Validate`) active. No repository or Pages-environment secret or variable. |
| Cloudflare account | `82299ce6e68134c4f13551fc22b12193` (`Oleg.v.kirienko@gmail.com's Account`). |
| Worker | `guitar-mastering-preview`, script tag `97d03318496d4ce98bbd62017698040f`, URL `https://guitar-mastering-preview.oleg-v-kirienko.workers.dev`, deployment `d6ee6ce0-5c95-4dc9-bb73-8f0d71e4fe0e`, version `c0244b68-05ed-4da5-9bf2-120c9af67bbb` at 100%, etag `7a74be9bbe3aafc1b41e6075d38c6a8927f1fc497407b894c2e1fd51beb10572`. Wrangler delete dry run exited without dependency error. No Worker custom domains, schedules, tails, routes, or Cloudflare Pages projects. |
| Worker bindings | D1 `DB` pointed to the approved UUID. `ASSETS`, `AUTH_ACCEPTANCE_ENABLED`, `ENVIRONMENT`, four rate-limit bindings, and secret name `AUTH_ACCEPTANCE_TOKEN` matched the manifest. No secret value was read. |
| D1 | `guitar-mastering-preview`, UUID `c70af9e6-73e0-4baa-8023-af8679cba410`, `EEUR`, 73,728 bytes, migration `0001_initial.sql` ID 1 applied `2026-09-11 16:48:40`. `users`, `profiles`, `sessions`, and `lesson_progress` each contained **0** rows, including on the repeat check after Worker deletion. |
| Railway production | Project `112644ba-cb91-443b-ae4b-73a0d6f74b69`, environment `994fd373-dd1d-4073-8b7f-116e77d898fa`, web `4d0a3739-0beb-4ea9-9a7e-7a9f3494708e` deployment `11a3dc0e-0092-4b61-8643-61cb30da5e3a` `SUCCESS`, PostgreSQL `82d4b5e1-830a-4467-bb1f-f9448fd1d58d` deployment `4187bbb4-bc5d-44fb-92da-b40e68022e01` `SUCCESS`, volume `4495ab33-2440-4d29-a4d4-e214813676a8`, PITR bucket `06fb8382-c35f-43be-b127-3fb98c30f3b0`, domain ID `1cff255c-4eea-493e-9c82-7d2ba1672046`. HTTPS health/readiness 200, unknown API 404, SPA root 200. None of the 26 production web variable names or locally inspected values referenced an exact legacy URL/platform/UUID; `DATABASE_URL` used the private Railway host and `PUBLIC_ORIGIN` matched the production domain. |

## Destructive actions and provider read-back

All timestamps are UTC on 2026-09-19. Only the approved targets were changed.

| Time | Action | Outcome |
|---|---|---|
| `10:54:06` | Authenticated `DELETE /repos/olegkirienko/guitar-mastering/pages`. | GitHub returned HTTP 204, request ID `8294:25A706:615F026:5ECD1F3:6AAE69CD`. Authenticated Pages GET then returned 404. At `10:55:42`, a fresh `/guitar-mastering/index.html` request returned GitHub's `Site not found` page, HTTP 404, CDN MISS, age 0. The root temporarily served a cached app shell, then returned HTTP 404, `Site not found`, CDN MISS, age 0 at `11:03:43`. |
| `10:54:53.766` | Deleted Worker `guitar-mastering-preview` without force. | Wrangler 4.131.1 reported success. Authenticated Cloudflare script and service lists became empty; workers.dev health returned 404. `wrangler secret list --name guitar-mastering-preview` returned `Worker not found`, confirming its secret and other bindings disappeared with the parent. |
| `10:55:26.237` | Deleted D1 UUID `c70af9e6-73e0-4baa-8023-af8679cba410` after Worker absence and repeated zero row counts. | Wrangler 4.131.1 reported success; authenticated D1 list returned `[]`. No D1 export was retained under Design Amendment 01. |

The Worker and D1 times are Wrangler command-completion telemetry timestamps;
their API mutations completed before those times. The shared Wrangler OAuth
credential was retained. No separate dedicated Cloudflare/GitHub credential
was present. The GitHub repository, workflow and environment history, Pages
fallback tag, and expired artifact metadata were retained.

## Post-retirement checks

- Railway status read-back retained the same successful web and PostgreSQL
  deployments, attached volume, and PITR bucket. The repository's HTTPS
  production smoke passed: health 200, readiness 200, unknown API JSON 404,
  SPA root 200.
- GitHub reported only the active `Validate` CI workflow. Active source/config
  search found no deploy action or legacy build script; a test assertion contains
  `deploy-pages` only as a negative check.
- Node 24.7.0 validation passed: `pnpm lint`, `pnpm build`, `pnpm test`
  (55 passed, 19 PostgreSQL-gated skipped), `pnpm test:postgres` (19 passed),
  `pnpm test:browser` (10 passed), and `git diff --check`. The initial sandboxed
  unit run timed out in local HTTP tests; the unrestricted rerun passed without
  code changes.
- Public Pages root cache expired. The final check at `11:03:43` returned
  HTTP 404 with GitHub's `Site not found` page (`x-cache: MISS`, age 0).

## Exceptions or partial completion

No deletion or identity exception occurred. The Pages CDN briefly served the
old root document after authenticated disablement; the root returned the
provider's 404 after cache expiry. No further legacy resource is active.
