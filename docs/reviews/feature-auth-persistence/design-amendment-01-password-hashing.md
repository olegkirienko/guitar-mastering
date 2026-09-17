# Design Amendment 01 — Cloudflare-compatible password hashing

## Amendment metadata

- **Work item:** `feature-auth-persistence`
- **Work-item type:** `technical_feature`
- **Authoritative design:** `docs/technical-designs/feature-auth-persistence.md`
- **Prior approved review:** `docs/reviews/feature-auth-persistence/design-review-02.md`
- **Affected slice:** `auth-session-api`
- **Date:** 2026-09-12
- **Status:** `REVISED — READY FOR DESIGN REVIEW`
- **Revision:** `HIGH-03 resource-admission architecture`
- **Next review identifier:** `design-review-04`

## Trigger

Deployed preview-runtime work discovered that Cloudflare Workers rejects PBKDF2
iteration counts above 100,000. The approved design requires
PBKDF2-HMAC-SHA-256 with 600,000 iterations, matching OWASP's current PBKDF2
guidance. Reducing the count to the runtime maximum would knowingly lower the
approved security baseline and is not permitted.

This artifact records a design amendment, not an implementation review. Prior
design and implementation review artifacts remain immutable snapshots.

## Runtime and guidance evaluation

- Cloudflare's current Workers documentation says `node:crypto` is natively
  supported and that all of its APIs are supported except a short list that
  includes Argon2 but does not include scrypt. With compatibility dates on or
  after 2026-08-04, Node.js compatibility is enabled by default. The repository
  currently pins 2026-09-11.
- Node's `node:crypto.scrypt` API exposes `N`, `r`, `p`, `keylen`, and `maxmem`,
  and recommends a unique random salt of at least 16 bytes.
- OWASP prefers Argon2id, but Cloudflare does not provide it natively. OWASP
  recommends scrypt when Argon2id is unavailable and lists several parameter
  sets as providing a similar minimum level of defense. The listed
  `N = 2^14, r = 8, p = 5` profile uses about 16 MiB per derivation.
- A Worker isolate has a shared 128 MB memory limit and may serve concurrent
  requests. The OWASP `N = 2^17, r = 8, p = 1` profile nominally consumes the
  entire limit for one derivation, so it is not a viable Worker profile. The
  selected 16 MiB profile preserves OWASP-listed strength while leaving room for
  runtime/application overhead and bounded concurrency.
- Password hashing is incompatible with the Workers Free plan's 10 ms request
  CPU budget. The production design therefore requires a paid plan with at least
  its default 30-second CPU allowance, plus an under-one-second preview latency
  gate and concurrent memory/error acceptance.

## Amended decision

New passwords use asynchronous native `node:crypto.scrypt` with:

- `N = 16,384 (2^14)`;
- `r = 8`;
- `p = 5`;
- 32-byte derived key;
- 32 MiB `maxmem` guard;
- a new cryptographically random 16-byte salt per hash;
- canonical unpadded base64url encoding;
- storage format
  `v2$scrypt$ln=14,r=8,p=5,dk=32$<salt-base64url>$<hash-base64url>`.

Verification is strict, bounded, version-dispatched, constant-time after key
derivation, and timing-equalized with a current-policy dummy hash for unknown or
unusable records. Successful verification may opportunistically upgrade a
supported old format through a compare-and-swap update with a fresh salt. Future
algorithm or parameter upgrades require a new reviewed policy version and the
same preview gates.

The authoritative design now contains the complete format grammar, verification
behavior, upgrade policy, runtime requirements, CPU/memory analysis, preview
acceptance criteria, and slice ownership.

## HIGH-03 resource-admission revision

Design Review 03 found that HTTP concurrency tests could not prove that requests
shared an isolate and that the permissive platform rate limiter did not enforce
the assumed scrypt memory budget. The authoritative design now requires one
module-scoped admission controller per Worker isolate, with a fixed limit of
three active password derivations and no queue. Every real, dummy, and
password-confirmation derivation must acquire a permit and release it in
`finally`; no route may call `scrypt` directly or create a second controller.

The three-permit limit budgets about 48 MiB of nominal scrypt working memory and
leaves about 80 MiB of the published 128 MB isolate limit for Worker/runtime
overhead. The controller deliberately protects an isolate-local resource. Other
isolates have independent memory, while eviction cancels work and reclaims the
evicted isolate, so a durable cross-isolate lock would add a remote dependency
without strengthening this memory invariant. Platform rate limiting remains a
separate abuse-reduction layer.

Login acquires after body/rate-limit validation but before any username lookup,
then holds the permit through real or dummy work. Registration and authenticated
password confirmation use the same admission boundary. Saturation starts no
derivation and returns a stable, non-enumerating `503 AUTH_BUSY` response with
`Retry-After: 1`; identifiers and credential material are absent from errors and
telemetry.

Preview acceptance no longer assumes separate HTTP requests share an isolate. A
preview-only, secret-protected route runs the proof within one invocation: it
holds three admitted exact-policy tasks at a barrier, verifies a fourth is
rejected before hashing, then releases and completes the three derivations. It
also invokes the real login coordinator under saturation with synthetic known
and unknown cases and proves byte-equivalent overload responses with zero
lookups and zero derivations. The route is absent in production, returns only
sanitized counters/timings, and the test repeats the boundary at least ten times.
Peak memory is recorded when the platform exposes it; otherwise the report must
record the metric's absence and retain admission, platform error, and
cancellation evidence.

## Migration impact

There are no preview users, so no live password migration and no D1 schema
migration are required. Preview acceptance must confirm zero user/password rows
before rollout. Experimental local/test PBKDF2 rows may be discarded with their
isolated databases. A durable PBKDF2 row would block deployment because the
Worker cannot verify the approved 600,000-iteration form; it would require a
password reset or a separately reviewed capable migration path. Hashes cannot be
translated to scrypt without the plaintext password.

## Security invariants preserved

- No PBKDF2 fallback at 100,000 iterations.
- No scrypt parameter set below an OWASP-listed profile.
- No fast general-purpose password hash.
- No silent parameter fallback when runtime acceptance fails.
- No more than three simultaneous password derivations in one Worker isolate.
- No queued password-derivation work and no admission decision based on account
  existence.
- No password, hash, salt, derived key, or account identifier in logs or public
  errors.
- Production remains blocked until deployed-preview capability, latency, CPU,
  memory, and concurrency gates pass.

## Review scope

Design Review 04 must verify that the HIGH-03 revision deterministically bounds
actual same-isolate scrypt work, that three permits are justified against the
published memory limit, that reset/eviction and failure semantics are complete,
and that the preview proof exercises the same resource and preserves login
non-enumeration under overload. It must also confirm that the route protection,
format, verification, rehash, acceptance, and migration contracts remain
deterministic and check the surrounding design for direct contradictions.

## Sources consulted

- Cloudflare Workers `node:crypto` documentation:
  <https://developers.cloudflare.com/workers/runtime-apis/nodejs/crypto/>
- Cloudflare Workers Node.js compatibility:
  <https://developers.cloudflare.com/workers/runtime-apis/nodejs/>
- Cloudflare Workers limits:
  <https://developers.cloudflare.com/workers/platform/limits/>
- Node.js `crypto.scrypt` API:
  <https://nodejs.org/api/crypto.html#cryptoscryptpassword-salt-keylen-options-callback>
- OWASP Password Storage Cheat Sheet:
  <https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html>
