# Design Review 05 — Serialized scrypt resource policy

## Review metadata

- **Work item:** `feature-auth-persistence`
- **Work-item type:** `technical_feature`
- **Design artifact:** `docs/technical-designs/feature-auth-persistence.md`
- **Amendment reviewed:** `docs/reviews/feature-auth-persistence/design-amendment-02-scrypt-resource-policy.md`
- **Prior amendment:** `docs/reviews/feature-auth-persistence/design-amendment-01-password-hashing.md`
- **Prior approved review:** `docs/reviews/feature-auth-persistence/design-review-04.md`
- **Affected slice:** `auth-session-api`
- **Workflow phase reviewed:** `design_review`
- **Date:** 2026-09-14
- **Verdict:** `APPROVED`

## Scope of review

This review assesses whether Amendment 02 is a deterministic and operationally
acceptable response to the deployed three-derivation resource failure. It also
checks the amended admission boundary, overload non-enumeration, dummy work,
failure mapping, same-isolate proof, sequential latency and real-flow evidence,
cleanup, and consistency with the unchanged scrypt policy. Prior amendments and
reviews remain immutable historical snapshots.

## Assessment

- **Goal, evidence, and scope:** The triggering preview failure, superseded
  three-permit assumption, affected slice, and production block are explicit.
  The amendment changes only isolate-local derivation admission and its
  acceptance evidence; it does not introduce another implementation slice or
  weaken the approved password policy.
- **Correctness and resource safety:** One synchronous, module-scoped permit is
  the minimum positive per-isolate concurrency budget. Because every real,
  dummy, creation, rehash, and confirmation derivation must use the same
  controller, the design removes multiplicative scrypt pressure within the
  protected 128 MB isolate boundary. A new isolate owns independent memory and
  a new controller, so a remote cross-isolate lock would not strengthen this
  invariant.
- **Security and non-enumeration:** Body and rate-limit validation precede
  admission, while admission precedes account or availability lookup. Saturated
  login and registration variants therefore perform no identifier-dependent
  storage work and return byte-equivalent `AUTH_BUSY` responses. Admitted
  unknown and unusable-record logins retain current-policy dummy work. Native
  failures release the permit, perform no mutation, disclose no credential
  detail, and cannot select a weaker fallback.
- **Operational behavior:** Zero queueing avoids accumulating password-bearing
  requests and gives callers an immediate, bounded `503` with `Retry-After`.
  The throughput tradeoff is explicit: one isolate can service only one admitted
  password flow at a time, including its pre-hash lookup. For this initial
  account foundation, that is proportionate to the demonstrated platform risk;
  raising the limit remains prohibited without new evidence and review.
- **Implementation feasibility:** A synchronous `tryAcquire` counter and
  idempotent single-use release capability are small, testable primitives in
  the Worker module. The design assigns all direct `scrypt` access to one module
  and includes success, exception, underflow, saturation, and coordinator
  coverage without creating a generic concurrency framework.
- **Validation and deployment:** The preview gate proves contention inside one
  invocation, exercises the real login and registration coordinators while the
  permit is held, requires at least 50 client-serialized derivations, measures
  real flow latency, runs successful register/login/confirmation paths, checks
  canonical rows, inspects platform outcomes, and proves preflight and cleanup.
  Treating any platform-generated resource-limit response as a failure is
  necessary because application code cannot guarantee translation of that
  response into its JSON contract.
- **Data, migration, and privacy:** The `TEXT` hash column and zero-row preview
  precondition remain unchanged. Acceptance output excludes identifiers,
  credentials, salts, hashes, and derived keys; test users and sessions must be
  isolated and proven absent after cleanup.
- **Slice boundary and abstraction:** The admission controller, auth
  coordinators, hashing implementation, and preview proof remain within
  `auth-session-api`. The amendment does not authorize profile UI, progress
  synchronization, production cutover, or unrelated refactoring.

No actionable blocking findings remain.

## Sources verified

- Cloudflare Workers CPU and per-isolate memory limits, concurrent-request
  behavior, replacement semantics, and invocation outcomes:
  <https://developers.cloudflare.com/workers/platform/limits/>
- Cloudflare Worker error 1102 meaning and resource-limit response behavior:
  <https://developers.cloudflare.com/support/troubleshooting/http-status-codes/cloudflare-1xxx-errors/error-1102/>
- Cloudflare native `node:crypto` support and unsupported Argon2 APIs:
  <https://developers.cloudflare.com/workers/runtime-apis/nodejs/crypto/>
- Node.js asynchronous `crypto.scrypt` parameters, approximate `maxmem` check,
  and salt guidance:
  <https://nodejs.org/api/crypto.html#cryptoscryptpassword-salt-keylen-options-callback>
- OWASP Password Storage Cheat Sheet scrypt profiles and work-factor guidance:
  <https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html>

## Verdict and gate recommendation

**Verdict: `APPROVED`**

Open a new `design_approval` human gate. The existing `auth-session-api` slice
remains paused and application code must not change until explicit approval is
supplied. After approval, the legal action is to resume that same slice and
replace the superseded three-permit policy with the approved one-permit,
zero-queue design; no new implementation slice is created.
