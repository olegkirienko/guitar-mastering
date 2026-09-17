# Design Amendment 02 — Serialized scrypt resource policy

## Amendment metadata

- **Work item:** `feature-auth-persistence`
- **Work-item type:** `technical_feature`
- **Authoritative design:** `docs/technical-designs/feature-auth-persistence.md`
- **Prior amendment:** `docs/reviews/feature-auth-persistence/design-amendment-01-password-hashing.md`
- **Prior approved review:** `docs/reviews/feature-auth-persistence/design-review-04.md`
- **Affected slice:** `auth-session-api`
- **Date:** 2026-09-14
- **Status:** `READY FOR DESIGN REVIEW`
- **Next review identifier:** `design-review-05`

## Trigger and evidence

The deployed preview same-invocation acceptance test invalidated Amendment 01's
approved three-permit concurrency assumption. Cloudflare returned a platform-
generated `503 Worker exceeded resource limits` during the initial proof. No
authentication flow completed. Preview D1 cleanup succeeded.

This evidence disproves the three-simultaneous-derivation budget, not the exact
`N = 2^14, r = 8, p = 5` scrypt profile for one derivation. This amendment
therefore preserves the password-security baseline and changes only isolate-
local resource admission and its acceptance proof. Amendment 01 and Design
Review 04 remain immutable historical snapshots.

## Amended decision

- Every Worker isolate has one module-scoped password-derivation controller
  with exactly one permit.
- At most one real, dummy, rehash, password-creation, or authenticated
  password-confirmation scrypt derivation runs in an isolate at once.
- There is no queue. Queue capacity is zero, no queue timeout exists, and a
  request that cannot acquire the permit is rejected immediately.
- Body validation and both rate-limit checks remain before admission. Admission
  remains before account lookup, availability lookup, or password-hash read.
- Saturation starts no lookup, write, real hash, or dummy hash. Every password-
  derivation route returns `503 AUTH_BUSY`, `Cache-Control: no-store`,
  `Retry-After: 1`, and the same public busy message without identifier or
  credential telemetry.
- Saturated login responses do not vary for known, unknown, wrong-password, or
  unusable-hash cases. Saturated registration responses do not vary for already-
  used and unused valid usernames. Only an admitted registration may disclose
  `409 USERNAME_UNAVAILABLE` after its lookup.
- An admitted unknown-user or unusable-hash login holds the permit through one
  current-policy dummy derivation. Dummy and real work use the same controller,
  exception mapping, and `finally` release.
- A controller invariant failure rejects before hashing with generic `503
  AUTH_UNAVAILABLE`. A native scrypt failure releases the permit, performs no
  account/session write, exposes no credential detail, and never falls back to
  PBKDF2, a fast hash, or weaker scrypt parameters.
- A platform-generated resource-limit response is an acceptance failure because
  application code may not be able to translate it into the JSON contract.
- Cloudflare rate limiting remains abuse reduction only and is not part of the
  deterministic memory invariant.

## Memory rationale

Cloudflare documents a fixed 128 MB memory limit per isolate, shared by the
JavaScript heap, native allocations, runtime, application, and concurrent
requests. It also documents that one isolate may handle many requests and that
memory-limit failures can surface as error 1102, `exceededMemory`, and a
Workers-generated 503.

The approved profile has a nominal scrypt working set of approximately 16 MiB,
about one-eighth of the published 128 MB limit. Serializing it leaves roughly
seven-eighths of that limit for runtime and application overhead. Its 32 MiB
`maxmem` setting is a per-call validation guard, not a measured allocation, but
one call under that guard remains well below the isolate limit. One permit is
the smallest useful concurrency budget and removes multiplicative KDF memory
pressure from same-isolate request bursts.

This arithmetic establishes plausibility, not proof: native/runtime overhead is
not fully controlled by the application, and the prior three-call estimate
failed in the real platform. Production remains blocked until the single-call
policy passes deployed preview acceptance. Unrelated application allocations
must still be bounded independently.

## Acceptance amendment

The deployed preview on the pinned compatibility date and production-intended
paid Workers plan must provide all of this evidence before implementation
review:

1. A secret-protected, preview-only route performs at least ten rounds inside
   one invocation. Each round holds the single permit at a barrier, proves a
   second acquisition is rejected before hashing, releases the barrier,
   completes one real exact-policy derivation, and observes a zero active count.
2. While that permit is held, the route drives the real login coordinator for
   synthetic known and unknown cases and the real registration coordinator for
   synthetic used and unused usernames. Each pair produces byte-equivalent
   `AUTH_BUSY` responses, zero lookups, zero writes, and zero derivations.
3. After warm-up, at least 50 derivations are issued sequentially, never with
   more than one client request in flight. Their p95 derivation wall time is
   below 1,000 ms, no request exceeds configured CPU, and the report includes
   p50/p95 derivation and flow latency. Server-measured p95 registration, login,
   and authenticated password-confirmation latency is below 1,250 ms for each
   flow; client-observed latency is recorded separately for operational context.
4. Real preview registration, login, and authenticated password confirmation
   complete sequentially with the exact approved parameters and canonical
   `v2$scrypt` rows. Wrong-password, unknown-user, and unusable-hash paths retain
   their approved non-enumerating behavior and current-policy dummy work.
5. The report identifies deployment version, compatibility date, Workers plan
   and CPU setting, proof window, sanitized outcomes, and whether peak memory
   telemetry is available. Metrics/logs for that window contain no platform-
   generated resource-limit 503, `exceededMemory`, `exceededCpu`, error 1102,
   cancellation, timeout, or unexpected 5xx.
6. A read-only preflight proves no existing preview password rows. Acceptance
   data is isolated, cleanup removes its users, sessions, and related rows, and
   a read-only postflight proves those rows are absent. Cleanup success alone
   does not substitute for a completed authentication flow.
7. Production routing proves the acceptance endpoint is absent even when a
   token is supplied. The preview route returns only counters, durations, and
   deployment/configuration identity—never identifiers, credentials, salts,
   hashes, or derived keys.

Any failure blocks the slice. A single exact-policy derivation that exceeds the
deployed resource limit is evidence that the profile itself is incompatible
with that runtime. Only the following design review may then consider a
different current OWASP-compliant profile or an isolated hashing architecture;
implementation may not lower parameters on its own.

## Security invariants preserved

- Exact scrypt parameters remain `N = 16,384`, `r = 8`, `p = 5`, `keylen = 32`,
  and `maxmem = 33,554,432`.
- No PBKDF2 fallback at 100,000 iterations and no fast general-purpose hash.
- No identifier-dependent admission, queueing, dummy-work bypass after
  admission, or credential-bearing telemetry.
- No reliance on Cloudflare's permissive rate limiter for memory safety.
- No production launch before deployed single-derivation, latency, CPU, error,
  real-flow, and cleanup evidence passes review.

## Design-review scope

Design Review 05 must decide whether the one-permit, zero-queue policy is a
deterministic and operationally acceptable response to the observed platform
failure; verify login and registration non-enumeration, dummy hashing, failure
mapping, same-isolate proof, sequential latency, real-flow evidence, and cleanup;
and confirm that the exact scrypt profile remains unchanged. It may recommend
lower parameters only if it concludes from deployed evidence that one current-
profile derivation is itself incompatible with the runtime.

## Sources consulted

- Cloudflare Workers limits:
  <https://developers.cloudflare.com/workers/platform/limits/>
- Cloudflare Workers error 1102:
  <https://developers.cloudflare.com/support/troubleshooting/http-status-codes/cloudflare-1xxx-errors/error-1102/>
- Cloudflare Workers `node:crypto` support:
  <https://developers.cloudflare.com/workers/runtime-apis/nodejs/crypto/>
- Node.js `crypto.scrypt` API:
  <https://nodejs.org/api/crypto.html#cryptoscryptpassword-salt-keylen-options-callback>
- OWASP Password Storage Cheat Sheet:
  <https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html>
