# Production origin update

## Goal

On 2026-10-05 the production web domain changed from
`https://guitar-mastering-web-production-production.up.railway.app` to
`https://guitar-mastering.up.railway.app`, and `PUBLIC_ORIGIN` was updated
to match. Two files in the repository still name the old origin, which now
returns 404:

- `.claude/settings.json:10`: the allowlisted
  `corepack pnpm smoke:production <origin>` command. Because of it, the
  delivery smoke on the real origin asks for permission every time, while the
  allowed command targets a dead host.
- `docs/operations/production-cutover.md:12`: "Canonical candidate origin".

This PR replaces both with the new origin.

## Non-goals

- No change to Railway: domains, variables, and `.railway/railway.ts` stay as
  they are. `PUBLIC_ORIGIN` remains `preserve()`, so its production value is
  the source of truth and is already correct.
- No change to `scripts/smoke-production.mjs`, the delivery skill, or
  `CLAUDE.md`. They take the origin as an argument and do not name it.
- No retroactive edits to designs or reviews that recorded the old origin as
  history.

## Design

- In `.claude/settings.json`, replace the allow entry exactly with
  `Bash(corepack pnpm smoke:production https://guitar-mastering.up.railway.app)`.
  The entry stays an exact command with no wildcard, so the permission scope
  does not widen. Leave the `ask` rules alone.
- In `docs/operations/production-cutover.md`, set the canonical origin to the
  new value and add one sentence: the domain was renamed on 2026-10-05, the
  old `*-production-production` host no longer resolves to the service, and
  `PUBLIC_ORIGIN` matches the new origin.
- Repository search after the edit:
  `git grep -n guitar-mastering-web-production-production -- ':!docs/technical-designs/production-origin.md'`
  returns nothing; this design is the only file that still names the old
  host.

## Security and privacy

The origin is already public. Changing `.claude/` permissions is a risky change
under `CLAUDE.md`, so it gets this design. The new rule allows only one
read-only HTTP smoke against our own origin. It adds no wildcard, secret, or
mutation.

## Deployment and rollback

This PR changes only docs and settings, so there is nothing to deploy and no
migration. After merge, the delivery check is
`corepack pnpm evidence:delivery --sha <merged SHA>` and
`corepack pnpm smoke:production https://guitar-mastering.up.railway.app`,
which now runs without a prompt. Rollback is a revert commit.

## Test strategy

- `corepack pnpm test`, `corepack pnpm build`, and `git diff --check`. No page
  changes, so `test:browser` is not needed.
- `.claude/settings.json` parses as JSON.
- The grep above returns nothing.
- Before the PR: `curl` returns 200 for the new origin `/` and 404 for the old
  origin, as checked on 2026-10-05.

## Slices

1. **Origin update.** Scope: the two edits above. Acceptance: the grep returns
   nothing, the settings JSON is valid, validation passes, and the
   post-merge smoke on the new origin passes.
