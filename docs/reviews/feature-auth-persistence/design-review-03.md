# Design Review 03 — Password-hashing amendment

## Review metadata

- **Work item:** `feature-auth-persistence`
- **Work-item type:** `technical_feature`
- **Design artifact:** `docs/technical-designs/feature-auth-persistence.md`
- **Amendment reviewed:** `docs/reviews/feature-auth-persistence/design-amendment-01-password-hashing.md`
- **Prior approved review:** `docs/reviews/feature-auth-persistence/design-review-02.md`
- **Affected slice:** `auth-session-api`
- **Workflow phase reviewed:** `design_review`
- **Date:** 2026-09-12
- **Verdict:** `CHANGES REQUIRED`

## Summary

The amendment chooses a supported and current password-storage primitive. The
exact `N = 2^14, r = 8, p = 5` profile is listed by OWASP as one of its
equivalent minimum scrypt configurations; the 16-byte salt, asynchronous Node
API, bounded parser, constant-time comparison, dummy verification, versioned
format, and fail-closed PBKDF2 migration policy form a deterministic security
contract. Cloudflare currently documents all `node:crypto` APIs as supported
except a short list that includes Argon2 but not scrypt, and the pinned
compatibility date satisfies the documented automatic Node.js compatibility
threshold. Node documents the selected parameters and confirms that 32 MiB is
above the approximate `128 * N * r` memory requirement.

The amendment is not yet ready for a new approval gate because its shared-isolate
memory premise is only tested, not enforced. The design acknowledges that a
Worker isolate can handle many concurrent requests but budgets only four scrypt
derivations, while its only admission control is a permissive, eventually
consistent rate limiter. The preview criterion therefore cannot prove or
preserve the memory bound under burst traffic or deliberate abuse.

## Blocking finding

### HIGH-03 — The per-isolate scrypt concurrency budget is not enforced

**Evidence**

- One derivation has a nominal 16 MiB working set and the Worker has a shared
  128 MB per-isolate limit. The design chooses four simultaneous derivations as
  an approximately 64 MiB acceptance case, leaving the remaining memory for the
  runtime and application.
- Registration, login, and password confirmation can all start a derivation.
  The design requires pre-hash validation and username/network rate-limit
  bindings but specifies no maximum number of in-flight derivations per isolate
  and no overload response.
- Cloudflare documents that one isolate may process many concurrent requests and
  that request pairs are not guaranteed to use either the same or different
  isolate. Four simultaneous HTTP requests therefore do not necessarily exercise
  64 MiB in one isolate.
- Cloudflare also documents the Workers Rate Limiting API as permissive,
  eventually consistent, and local to a Cloudflare location. It reduces abuse
  but cannot serve as a strict concurrency admission gate.

**Impact**

A burst can start more than the four derivations assumed by the resource model
inside one isolate. Eight nominal working sets consume the entire published
128 MB limit before JavaScript/runtime overhead; fewer may be sufficient to
trigger `exceededMemory`, cancellation, or error 1102. Because the rate limiter
may temporarily admit concurrent calls, passing the proposed preview test does
not establish the claimed production safety invariant. An attacker can turn the
expensive authentication routes into an availability failure even when every
individual derivation satisfies the latency and CPU gates.

**Required revision**

Define a deterministic resource-admission architecture for password derivation
and assign it to `auth-session-api`. It must cap actual simultaneous scrypt work
to a justified per-isolate or isolated-service budget, fail closed with a stable
non-enumerating overload response before starting a derivation, and apply equally
to real, dummy, and password-confirmation work. Do not rely on a mutable global
as a durable cross-isolate limit; if an isolate-local guard is selected, specify
its reset/eviction semantics and explain why it is sufficient alongside the
platform limiter. A Durable Object, service boundary, or other serialization or
bounded-concurrency design is also acceptable if its routing, failure behavior,
and latency tradeoffs are explicit.

Revise preview acceptance so the test proves the intended same-resource
concurrency condition rather than assuming multiple HTTP requests share an
isolate, exercises the admission boundary and overload path, records peak memory
telemetry where the platform exposes it, and verifies that overload cannot skip
dummy-work equivalence in a way that reintroduces account enumeration. Keep the
OWASP-listed scrypt parameters unchanged unless a separate reviewed amendment
justifies another current policy.

## Amendment assessment

- **Goal and scope clarity:** The trigger, affected slice, superseded assumption,
  migration boundary, and prohibited weakenings are explicit. The amendment
  remains limited to password storage and its runtime requirements.
- **Correctness and security:** The algorithm choice, parameter profile, salt
  length, versioned canonical format, bounded dispatch, constant-time comparison,
  and generic failure behavior are sound. `HIGH-03` is the remaining denial-of-
  service and availability defect.
- **Implementation feasibility:** Native asynchronous `node:crypto.scrypt` is a
  plausible Worker implementation on the pinned compatibility date, subject to
  deployed-preview proof. A concurrency-control choice must be designed before
  implementation can be judged feasible under the shared memory limit.
- **Data and migration:** Keeping `password_hash` as `TEXT`, rejecting unusable
  PBKDF2 rows, proving that preview contains no durable password rows, and
  requiring reset or a separately reviewed migration service are deterministic
  and avoid pretending hashes can be translated without plaintext.
- **Validation:** Fixed vectors, malformed-format cases, timing-equivalent public
  failures, sequential latency, CPU telemetry, and zero-row preflight are strong.
  The concurrency test needs the revision described in `HIGH-03`.
- **Slice boundaries and abstraction:** Password hashing, admission control, auth
  rate limiting, and their preview proof belong in the existing
  `auth-session-api` slice. No new implementation slice or generic framework is
  warranted.

## Sources verified

- Cloudflare Workers `node:crypto` support and compatibility-date behavior:
  <https://developers.cloudflare.com/workers/runtime-apis/nodejs/crypto/>
- Cloudflare Workers CPU and per-isolate memory limits:
  <https://developers.cloudflare.com/workers/platform/limits/>
- Cloudflare Workers isolate routing and concurrent-request semantics:
  <https://developers.cloudflare.com/workers/reference/how-workers-works/>
- Cloudflare Workers Rate Limiting API locality and accuracy:
  <https://developers.cloudflare.com/workers/runtime-apis/bindings/rate-limit/>
- Node.js asynchronous scrypt parameters, memory bound, and salt guidance:
  <https://nodejs.org/api/crypto.html#cryptoscryptpassword-salt-keylen-options-callback>
- OWASP Password Storage Cheat Sheet scrypt profiles and work-factor guidance:
  <https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html>

## Verdict and transition

**Verdict: `CHANGES REQUIRED`**

Do not open a new `design_approval` gate and do not resume application changes
for `auth-session-api`. Return to `phase: design` with `HIGH-03` active, revise
the authoritative design and amendment to define enforceable hashing-resource
admission and acceptance, then submit the revision for a new immutable design
review.
