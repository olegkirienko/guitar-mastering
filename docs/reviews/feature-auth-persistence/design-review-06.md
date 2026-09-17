# Design Review 06 — Workers password-KDF compatibility

## Review metadata

- **Work item:** `feature-auth-persistence`
- **Work-item type:** `technical_feature`
- **Design artifact:** `docs/technical-designs/feature-auth-persistence.md`
- **Amendment reviewed:** `docs/reviews/feature-auth-persistence/design-amendment-03-workers-kdf.md`
- **Prior amendment:** `docs/reviews/feature-auth-persistence/design-amendment-02-scrypt-resource-policy.md`
- **Prior approved review:** `docs/reviews/feature-auth-persistence/design-review-05.md`
- **Affected slice:** `auth-session-api`
- **Workflow phase reviewed:** `design_review`
- **Date:** 2026-09-15
- **Verdict:** `APPROVED`

## Scope of review

This review assesses whether Amendment 03 is a secure, feasible, and
operationally bounded response to the failed one-permit Workers Paid proof. It
checks the interpretation of the deployed evidence, the replacement scrypt
policy, Workers memory and CPU uncertainty, verifier and migration behavior,
non-enumeration, failure handling, deployed acceptance, the rejected PBKDF2
alternative, the mandatory external-runtime fallback, consistency with the
authoritative design, and the unchanged `auth-session-api` slice boundary.
Prior amendments and reviews remain immutable historical snapshots.

## Assessment

- **Goal, evidence, and scope:** The amendment identifies the disproven
  compatibility assumption and preserves the observed Paid-run outcome as
  `exceededResources` rather than assigning an unsupported CPU or memory cause.
  The recorded approximately 2.05 seconds of CPU use is well below the
  documented 30-second default Paid HTTP CPU allowance, but that comparison is
  correctly treated as evidence against a confident CPU diagnosis, not as proof
  of a memory diagnosis. The change remains limited to password-KDF policy and
  acceptance for the paused `auth-session-api` slice.
- **Security policy:** The exact `N = 2^13`, `r = 8`, `p = 10` tuple is one of
  OWASP's listed scrypt configurations with a similar minimum defense to the
  superseded `N = 2^14`, `r = 8`, `p = 5` tuple. Selecting the complete tuple,
  retaining unique 16-byte salts and a 32-byte derived key, and prohibiting
  independent parameter reduction preserves a defensible memory-hard baseline.
  Rejecting the observed 100,000-iteration PBKDF2 ceiling is proportionate
  because it is below OWASP's 600,000-iteration HMAC-SHA-256 guidance and lacks
  scrypt's memory hardness.
- **Workers compatibility and resource bounds:** Cloudflare documents 128 MB
  per isolate for both Free and Paid plans, while Node documents the approximate
  `128 * N * r` scrypt memory check and `maxmem` upper bound. The design's 8 MiB
  nominal calculation and fixed 16 MiB guard materially reduce the candidate's
  per-call memory allowance relative to the failed profile. The amendment does
  not mistake this arithmetic for platform proof: native/OpenSSL overhead,
  isolate-wide use, and the higher `p = 10` CPU cost remain explicit risks, and
  exactly one isolate-local derivation plus deployed evidence remain mandatory.
- **Runtime feasibility:** Cloudflare currently documents `node:crypto` as
  natively supported for the pinned compatibility-date regime and explicitly
  excludes Argon2, not scrypt. The asynchronous API, one-permit zero-queue
  controller, `finally` release, and ban on direct alternative call paths are
  small, testable implementation boundaries. Admission before identifier lookup
  keeps saturated behavior independent of account existence.
- **Verifier, migration, and data integrity:** The `v3$scrypt` grammar fixes and
  allowlists all resource-affecting parameters, requires canonical encodings and
  exact decoded lengths, and keeps `maxmem` out of attacker-controlled storage.
  Refusing to execute incompatible experimental `v1` and `v2` rows is safer than
  silently weakening verification. With the documented zero-user preview state,
  recreating experimental data is sufficient; any future durable incompatible
  row blocks deployment or requires a separately reviewed reset/migration path.
- **Non-enumeration, privacy, and failure behavior:** Real, dummy, creation,
  rehash, and confirmation work share one admission boundary. Saturated known
  and unknown login requests, and used and unused registration requests, have
  byte-equivalent `AUTH_BUSY` contracts before lookup or KDF work. Admitted
  unknown and unusable-record cases perform current-policy dummy work. Native
  failures release admission, create no auth mutation, expose only
  `AUTH_UNAVAILABLE`, and cannot trigger a weaker fallback; acceptance output
  excludes credential and identifier material.
- **Validation and deployment:** The preview gate uses one production-shaped
  derivation per invocation, separates contention rounds from at least 50 timed
  client-serialized requests, measures derivation and complete auth flows,
  exercises real/dummy/incompatible paths, proves coordinator saturation with
  zero storage/KDF starts, checks platform outcomes, and requires D1 preflight,
  cleanup, and postflight evidence. Treating `exceededResources`, categorized
  resource outcomes, cancellation, timeout, and unexpected 5xx responses as
  failures prevents an ambiguous platform result from becoming approval
  evidence. The explicit fallback to a separately designed external identity or
  dedicated hashing runtime prevents repeated local parameter erosion.
- **Slice boundary and abstraction:** Amendment 03 updates the already-approved
  `auth-session-api` responsibilities without adding a slice or authorizing UI,
  progress, cutover, or unrelated refactoring. The authoritative design
  consistently names `v3`, the one-permit controller, the same acceptance gate,
  and the external-runtime fallback. The remaining later slices are unchanged.

No actionable blocking findings remain.

## Sources verified

- Cloudflare Workers CPU and per-isolate memory limits and categorized resource
  outcomes:
  <https://developers.cloudflare.com/workers/platform/limits/>
- Cloudflare invocation-status meaning, including generic
  `exceededResources`:
  <https://developers.cloudflare.com/workers/observability/metrics-and-analytics/>
- Cloudflare native `node:crypto` support and unsupported Argon2 APIs:
  <https://developers.cloudflare.com/workers/runtime-apis/nodejs/crypto/>
- Node.js asynchronous `crypto.scrypt` parameters, approximate memory check,
  `maxmem`, and salt guidance:
  <https://nodejs.org/api/crypto.html#cryptoscryptpassword-salt-keylen-options-callback>
- OWASP Password Storage Cheat Sheet scrypt profiles and PBKDF2 guidance:
  <https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html>

## Verdict and gate recommendation

**Verdict: `APPROVED`**

Open a new `design_approval` human gate. The existing `auth-session-api` slice
remains paused and application code must not change until explicit approval is
supplied. After approval, the legal action is to resume that same slice and
replace the superseded `v2` policy with the approved `v3` policy and acceptance
contract. If the exact `v3` profile fails deployed acceptance, return to design
for an external identity provider or dedicated hashing runtime; no further
local parameter reduction is authorized.
