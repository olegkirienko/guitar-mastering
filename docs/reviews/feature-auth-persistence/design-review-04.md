# Design Review 04 — Password-hashing resource admission

## Review metadata

- **Work item:** `feature-auth-persistence`
- **Work-item type:** `technical_feature`
- **Design artifact:** `docs/technical-designs/feature-auth-persistence.md`
- **Amendment reviewed:** `docs/reviews/feature-auth-persistence/design-amendment-01-password-hashing.md`
- **Prior review:** `docs/reviews/feature-auth-persistence/design-review-03.md`
- **Affected slice:** `auth-session-api`
- **Workflow phase reviewed:** `design_review`
- **Date:** 2026-09-12
- **Verdict:** `APPROVED`

## Scope of re-review

This review verifies the revision against `HIGH-03`, checks that the amendment's
password format, verification, migration, route-protection, and preview
acceptance contracts remain deterministic, and checks the surrounding design
for direct contradictions. Design Review 03 remains an immutable snapshot.

## Finding resolution

### HIGH-03 — RESOLVED

The revised design now gives the password-hashing module one module-scoped,
isolate-local admission controller with three permits and no queue. Acquisition
is synchronous, so JavaScript run-to-completion makes the counter transition
atomic within the isolate; every real, dummy, and password-confirmation
derivation uses the same controller and releases its single-use permit in a
`finally` block. No route may invoke native `scrypt` directly or construct a
second controller. This changes the three-derivation resource budget from a
test assumption into an enforced invariant.

The scope of the controller matches the protected resource. Cloudflare's memory
limit applies per isolate, and each isolate has independent memory and module
scope. A cross-isolate durable lock would therefore coordinate instances that
do not share the protected allocation. A fresh isolate starting with zero
permits is safe because it also starts with a separate memory budget.

The overload contract is deterministic and non-enumerating. Login acquires a
permit before username lookup and holds it through real or dummy work;
registration and authenticated password confirmation use the same boundary.
Saturation starts no lookup or derivation and returns the same `503 AUTH_BUSY`
status, headers, body, and coarse telemetry regardless of the supplied account
identifier.

The preview acceptance proof no longer infers isolate placement from separate
HTTP requests. Its protected preview-only route holds three permits inside one
invocation, verifies rejection of a fourth before hashing, completes three real
exact-policy derivations, and proves the controller returns to zero. It also
drives the real login coordinator under saturation with instrumented known- and
unknown-user cases, proving byte-equivalent responses and zero lookups or
derivations. Repetition, latency, CPU, platform-error, cancellation, production-
route absence, secret handling, sanitized output, and optional memory-telemetry
requirements give implementation review objective acceptance evidence.

### LOW-02 — NON-BLOCKING

The design says isolate eviction cancels in-flight work. Cloudflare's current
documentation is more nuanced: Workers isolates are normally evicted after
their events resolve, while a memory-limit event may allow in-flight requests
to complete in the old isolate and route subsequent requests to a new isolate;
under extreme load some requests may be cancelled. The design should replace
the unconditional cancellation sentence with that documented lifecycle.

This wording does not reopen `HIGH-03`. In every documented case, work that
continues remains governed by the old isolate's controller and memory budget,
while a new isolate receives an independent controller and independent 128 MB
budget. The preview gate also already rejects cancellation, timeout,
`exceededMemory`, and error 1102.

## Amendment assessment

- **Goal and scope:** The runtime-discovered PBKDF2 incompatibility, affected
  slice, superseded assumption, prohibited weakenings, and migration boundary
  remain explicit. No unrelated feature or new slice was introduced.
- **Correctness and security:** The OWASP-listed scrypt profile, strict
  versioned grammar, bounded verifier dispatch, unique salts, constant-time
  comparison, dummy work, opportunistic compare-and-swap upgrade, and stable
  overload response form a coherent security contract.
- **Architecture and feasibility:** A synchronous isolate-local admission
  counter is compatible with Workers' single-threaded event loop and protects
  the same per-isolate memory boundary. Three nominal 16 MiB working sets leave
  approximately 80 MiB of the published 128 MB limit for runtime and
  application overhead, subject to mandatory deployed-preview proof.
- **Data and migration:** `password_hash` remains a compatible `TEXT` column;
  zero durable preview rows are required before rollout; experimental local
  PBKDF2 data may be recreated; and any durable PBKDF2 row blocks deployment
  pending reset or a separately reviewed migration path.
- **Validation:** Unit tests cover admission, release, exception, parser,
  verifier, rehash, and non-enumeration behavior. The preview gate covers native
  capability, exact parameters, fixed vectors, latency, CPU, same-isolate
  concurrency, overload equivalence, route protection, platform failures, and
  pre-rollout data state.
- **Slice boundaries and abstraction:** Hashing, admission, auth coordination,
  and the preview proof remain inside `auth-session-api`. The single-purpose
  controller is proportionate and does not create a generic concurrency
  framework.

No actionable blocking findings remain.

## Sources verified

- Cloudflare Workers per-isolate memory, concurrent-request, CPU, and error
  behavior:
  <https://developers.cloudflare.com/workers/platform/limits/>
- Cloudflare isolate lifetime, single-threaded concurrency, and distributed
  routing semantics:
  <https://developers.cloudflare.com/workers/reference/how-workers-works/>
- Cloudflare native `node:crypto` support:
  <https://developers.cloudflare.com/workers/runtime-apis/nodejs/crypto/>
- Node.js asynchronous scrypt parameters and memory guard:
  <https://nodejs.org/api/crypto.html#cryptoscryptpassword-salt-keylen-options-callback>
- OWASP Password Storage Cheat Sheet scrypt profiles:
  <https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html>

## Verdict and gate recommendation

**Verdict: `APPROVED`**

Open a new `design_approval` human gate. The existing `auth-session-api` slice
remains paused until explicit approval is supplied. After approval, the legal
action is to resume that same slice and replace its superseded PBKDF2 work with
the approved scrypt and admission design; no new implementation slice is
created.
