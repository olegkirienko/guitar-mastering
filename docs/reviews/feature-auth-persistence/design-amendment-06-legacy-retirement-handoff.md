# Design Amendment 06 — Legacy-platform retirement ownership handoff

## Amendment metadata

- **Parent work item:** `feature-auth-persistence`
- **Parent work-item type:** `technical_feature`
- **Receiving work item:** `infra-legacy-platform-retirement`
- **Parent authoritative design:**
  `docs/technical-designs/feature-auth-persistence.md`
- **Retirement authoritative design:**
  `docs/technical-designs/infra-legacy-platform-retirement.md`
- **Date:** 2026-09-17
- **Status:** `APPROVED`
- **Approval basis:** Explicit owner instruction to record the cleanup-ownership
  handoff after completion of `feature-auth-persistence`.

## Established state

`feature-auth-persistence` completed its approved
`production-cutover-operations` slice and its final completion gate. The
approved implementation review and production-cutover evidence establish that
Railway production is deployed, healthy, and the active canonical application
runtime. The completed parent work item remains closed.

## Ownership decision

Effective with this amendment, `infra-legacy-platform-retirement` owns the
remaining repository and remote retirement of these superseded platform
surfaces:

- the GitHub Pages deployment path;
- the Cloudflare Worker;
- Cloudflare D1;
- Cloudflare bindings, secrets, and configuration associated with those
  superseded resources.

This handoff includes the repository cleanup, non-destructive inventory and
evidence work, and eventual remote retirement defined by the approved
`infra-legacy-platform-retirement` design. It does not transfer ownership of
authentication, persistence behavior, production Railway operation, or any
other completed product work.

## Safety and workflow boundary

This amendment records ownership only. It does not authorize repository
cleanup, remote mutation, or resource deletion by itself.

Destructive remote cleanup remains governed exclusively by
`infra-legacy-platform-retirement` and its own explicit
`next_slice_approval` action
`authorize-destructive-live-legacy-resource-retirement`, bound to the reviewed
manifest digest and exact remote identities required by that work item's
approved design.

The completed `feature-auth-persistence` work item must not be reopened for
cleanup implementation. Its terminal workflow state, completed slices, final
review, and product history remain unchanged; this post-completion amendment is
only the durable cross-work-item ownership record required by the retirement
design.

## Disposition

The ownership-handoff precondition for
`repository-cleanup-and-retirement-preflight` is satisfied. That slice remains
subject to every other prerequisite in its approved design, including fresh
Railway production-readiness verification and collision checks before
repository cleanup begins.
