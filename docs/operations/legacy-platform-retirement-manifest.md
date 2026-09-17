# Legacy platform retirement approval manifest

## Manifest status

- **Work item:** `infra-legacy-platform-retirement`
- **Prepared:** 2026-09-17
- **Scope:** Exact non-secret inventory for the proposed destructive retirement
  of GitHub Pages and the legacy Cloudflare Worker/D1 stack.
- **Current authorization:** Inventory and repository cleanup only.
- **Destructive authorization:** **NOT GRANTED**. No resource in this manifest
  may be disabled, deleted, detached, or revoked before the dedicated
  `authorize-destructive-live-legacy-resource-retirement` human gate.
- **Repository-state basis:** base commit
  `0d755047f1f43cdadbdabcc78321918b23b7d45f`; implementation review must freeze
  the exact working-tree diff identity and this file's SHA-256 before opening
  the gate.

## Canonical Railway production

Authenticated Railway read-back and HTTPS smoke on 2026-09-17 establish the
active canonical runtime:

| Resource | Exact identity | Verified state |
|---|---|---|
| Project | `guitar-mastering` (`112644ba-cb91-443b-ae4b-73a0d6f74b69`) | Accessible in workspace `0b444469-be55-4550-9c08-73c011326e77` |
| Environment | `production` (`994fd373-dd1d-4073-8b7f-116e77d898fa`) | Active |
| Web service | `guitar-mastering-web-production` (`4d0a3739-0beb-4ea9-9a7e-7a9f3494708e`) | One running replica |
| Web deployment | `11a3dc0e-0092-4b61-8643-61cb30da5e3a` | `SUCCESS`; image digest `sha256:754ed46509cc30689caaa79c6adc79f3e1d791a8beb34645dd9ea62d68766ccc` |
| Canonical origin | `https://guitar-mastering-web-production-production.up.railway.app` (domain ID `1cff255c-4eea-493e-9c82-7d2ba1672046`) | Domain `ACTIVE`; health `200`, readiness `200`, API boundary `404`, SPA root `200` |
| PostgreSQL service | `Postgres-DOv_` (`82d4b5e1-830a-4467-bb1f-f9448fd1d58d`) | Deployment `4187bbb4-bc5d-44fb-92da-b40e68022e01` is `SUCCESS` |
| PostgreSQL volume | `postgres-volume-1GMc` (`4495ab33-2440-4d29-a4d4-e214813676a8`) | Attached, `READY` |
| PITR bucket | `Postgres-PITR` (`06fb8382-c35f-43be-b127-3fb98c30f3b0`) | Retained; production recovery evidence is recorded separately |

The production web variable inventory contains no Cloudflare, Workers,
Wrangler, D1, GitHub Pages, or `github.io` key or value reference. Its only
database dependency is the private Railway PostgreSQL reference. Railway has no
route, service, database, variable, or domain dependency on the legacy Pages or
Cloudflare resources. **No Railway resource is a retirement target.**

## GitHub Pages retirement target

Authenticated GitHub CLI inventory for `olegkirienko/guitar-mastering`:

| Field | Exact inventory |
|---|---|
| Pages URL | `https://olegkirienko.github.io/guitar-mastering/` |
| Pages API identity | `repos/olegkirienko/guitar-mastering/pages` |
| Build/source | `workflow`; `main` branch, `/` path |
| Visibility/TLS | Public; HTTPS enforced |
| Custom domain | None (`cname: null`) |
| Environment | `github-pages`, ID `21487646710`; branch-policy protection; admins may bypass |
| Last successful Pages run | `34624671934`, commit `8c502ac4c5894d2fbec4496446794e6edd497f2a`, completed 2026-09-11 |
| Artifacts | Pages artifacts exist only as expired records; latest artifact ID `10274660669` expired 2026-09-12 |
| Repository secrets/variables | None |
| `github-pages` secrets/variables | None |
| Public read-back | HTTP `200` on 2026-09-17; the site remains live |

The immutable annotated fallback tag `pages-fallback-2026-09-17` has tag object
`d83f4c881119b52c2456a835a3012173c9d466d0` and resolves to commit
`8c502ac4c5894d2fbec4496446794e6edd497f2a`. The tag is historical restoration
evidence; the active repository no longer contains a Pages deployment workflow
after this cleanup is merged.

## Cloudflare Worker retirement target

- **Account:** `Oleg.v.kirienko@gmail.com's Account`
  (`82299ce6e68134c4f13551fc22b12193`).
- **Worker:** `guitar-mastering-preview`; immutable script tag
  `97d03318496d4ce98bbd62017698040f`.
- **URL:** `https://guitar-mastering-preview.oleg-v-kirienko.workers.dev`.
- **Latest deployment:** `d6ee6ce0-5c95-4dc9-bb73-8f0d71e4fe0e`, created
  2026-09-14, serving version `c0244b68-05ed-4da5-9bf2-120c9af67bbb` at 100%.
- **Version/script etag:**
  `7a74be9bbe3aafc1b41e6075d38c6a8927f1fc497407b894c2e1fd51beb10572`.
- **workers.dev:** enabled; preview URLs disabled.
- **Routes/custom domains:** none.
- **Cron schedules:** none.
- **Tail consumers / active tails:** none.
- **Cloudflare Pages projects:** none in the account.
- **Secret names:** `AUTH_ACCEPTANCE_TOKEN` only; no value was read.
- **Plain-text binding names:** `AUTH_ACCEPTANCE_ENABLED`, `ENVIRONMENT`.
- **Other bindings:** static assets `ASSETS`; D1 `DB`; rate-limit namespaces
  `REGISTER_USERNAME_RATE_LIMITER` (`2101`),
  `REGISTER_NETWORK_RATE_LIMITER` (`2102`),
  `LOGIN_USERNAME_RATE_LIMITER` (`2103`), and
  `LOGIN_NETWORK_RATE_LIMITER` (`2104`).
- **Public read-back:** health and readiness returned `200` with `ok`/`ready`
  on 2026-09-17; the Worker remains live.

The authenticated operator credential is Wrangler OAuth account access, not a
repository-specific token and not a deletion candidate. No Cloudflare secret or
token is stored in GitHub Actions. No dedicated legacy credential requiring a
separate revocation was discovered.

## Cloudflare D1 retirement target

| Field | Exact inventory |
|---|---|
| Name | `guitar-mastering-preview` |
| UUID | `c70af9e6-73e0-4baa-8023-af8679cba410` |
| Region / size | `EEUR`; 73,728 bytes |
| Binding | Worker `guitar-mastering-preview`, binding `DB` |
| Migration | `0001_initial.sql`, migration ID `1`, applied `2026-09-11 16:48:40` |
| Application tables | `users`, `profiles`, `sessions`, `lesson_progress` |
| Application row counts | `0`, `0`, `0`, `0` respectively |
| Other tables | `d1_migrations`; provider-internal `_cf_KV` |
| Recent activity | 1 read query, 0 write queries, 0 rows read/written in the reported 24-hour window |

Design Amendment 01 removes the mandatory external D1 export, checksum, and
retention requirement because this preview database contains no unique or
unrecoverable data. There will be no D1 data rollback artifact after deletion.

## Dependency conclusion

- Railway production does not reference or route through GitHub Pages, the
  Worker URL, Cloudflare, Wrangler, or D1.
- The Worker depends on the exact D1 UUID through `DB`; therefore the Worker
  must be deleted and verified absent before D1 deletion.
- No routes, custom domains, schedules, tail consumers, active tails, service
  bindings, Cloudflare Pages projects, or GitHub secrets/variables add another
  consumer.
- The live legacy URLs are rollback-only historical surfaces and are not the
  canonical production origin.

## Approved deletion order after the dedicated gate

1. Reconfirm this manifest SHA-256, repository-state identity, exact remote
   identities, Railway health, and zero D1 application row counts.
2. Confirm the reviewed repository cleanup is merged so normal automation
   cannot recreate a legacy deployment.
3. Observe the approved quiet/drain check and keep Railway canonical.
4. Disable GitHub Pages for `olegkirienko/guitar-mastering`; retain repository,
   workflow history, environment history, fallback tag, and expired artifact
   metadata.
5. Delete Worker `guitar-mastering-preview` by exact name without force; verify
   its workers.dev URL and authenticated lists no longer expose it.
6. Recheck dependencies, then delete D1 UUID
   `c70af9e6-73e0-4baa-8023-af8679cba410`; verify authenticated absence.
7. Confirm the Worker secret disappears with the Worker. Do not revoke the
   shared Wrangler OAuth identity or touch any Railway resource.
8. Re-run Railway HTTPS smoke and complete the retirement record with provider
   read-back evidence.

## Rollback limitations

Before deletion, repository rollback can use Git history and the fallback tag.
After Pages/Worker/D1 deletion, the legacy resources may require recreation with
new identities; there is no retained D1 export. The supported production
recovery path is Railway deployment rollback and Railway PostgreSQL PITR. These
limitations are accepted by Design Amendment 01 and are why exact destructive
approval remains mandatory.

