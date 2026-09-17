# Design Amendment 03 — Workers password-KDF compatibility

## Amendment metadata

- **Work item:** `feature-auth-persistence`
- **Work-item type:** `technical_feature`
- **Authoritative design:** `docs/technical-designs/feature-auth-persistence.md`
- **Prior amendment:** `docs/reviews/feature-auth-persistence/design-amendment-02-scrypt-resource-policy.md`
- **Prior approved review:** `docs/reviews/feature-auth-persistence/design-review-05.md`
- **Affected slice:** `auth-session-api`
- **Date:** 2026-09-15
- **Status:** `READY FOR DESIGN REVIEW`
- **Next review identifier:** `design-review-06`

## Trigger and evidence

The approved `N = 2^14, r = 8, p = 5` scrypt policy failed deployed-preview
acceptance under both Workers Free and Workers Paid. The Paid run used the
approved one-permit, zero-queue implementation, yet Cloudflare terminated the
protected request with an HTML `503 Worker exceeded resource limits` rather
than the application's JSON contract. Metrics for the proof window recorded:

- invocation status `exceededResources`;
- one request and one error;
- zero subrequests;
- approximately 2.05 seconds CPU time;
- approximately 2.34 seconds wall time.

D1 preflight and postflight remained clean: users, profiles, and sessions were
all zero. No real authentication flow completed and the acceptance report was
not returned.

This evidence disproves Amendment 02's assumption that serialization alone
would make the selected profile compatible. It does not identify the exhausted
resource. Workers Paid has a default 30-second HTTP CPU allowance and permits a
higher configured allowance, while the observed invocation consumed only about
2 seconds. The amendment therefore does not label the failure `exceededCpu`.
Workers Free and Paid both retain the same 128 MB per-isolate memory boundary;
native/OpenSSL allocation behavior and other runtime overhead are the primary
compatibility constraints to investigate.

## Decision order and outcome

The options were evaluated in the required order.

1. Select the lower-memory OWASP-listed scrypt profile `N = 2^13, r = 8,
   p = 10` as the next current policy, subject to a new deployed-preview gate.
2. Do not select PBKDF2-HMAC-SHA-256 at the observed Workers maximum of 100,000
   iterations because it is materially below OWASP's 600,000-iteration
   baseline and removes memory hardness.
3. If the selected 8 MiB scrypt profile fails its deployed gate, stop local KDF
   work and return to design for an external identity provider or dedicated
   hashing runtime. No still-lower local scrypt profile is authorized.

The one-permit, zero-queue controller remains. It protects isolate-local memory,
keeps overload bounded, and preserves identifier-independent admission even
though it was insufficient by itself to make the superseded profile viable.

| Option | Offline defense | Workers fit | Operational cost | Decision |
|---|---|---|---|---|
| A. scrypt `2^13/8/10` | OWASP-listed memory-hard minimum | Plausible at 8 MiB nominal/16 MiB guard; live proof required | Low | Selected behind gate |
| B. PBKDF2-SHA-256 `100,000` | CPU-only and one sixth of OWASP's stated work factor | Previously proven executable | Low to medium | Rejected for security |
| C. External/dedicated hashing | Can use preferred Argon2id/current provider policy | KDF runs outside Worker isolate | High | Mandatory fallback if A fails |

## Option A — lower-memory scrypt (selected, acceptance-gated)

### Security rationale and offline resistance

Use asynchronous native `node:crypto.scrypt` with:

- `N = 8,192 (2^13)`;
- `r = 8`;
- `p = 10`;
- 32-byte derived key;
- 16-byte random salt;
- `maxmem = 16,777,216` bytes.

OWASP lists this 8 MiB profile alongside the former 16 MiB profile as providing
a similar minimum defense with a RAM/CPU tradeoff. It remains memory-hard and
therefore imposes a memory cost on each offline password guess, unlike PBKDF2.
The increased `p` preserves the listed CPU/memory tradeoff; parameters must be
treated as one indivisible policy and must not be independently reduced.

The existing 12-code-point minimum, 128-code-point maximum, unique salts, rate
limits, generic errors, and optional future stronger-policy rehash remain.
Online rate limits do not count as offline-cracking resistance.

### Workers runtime, memory, and CPU

Node documents scrypt's approximate primary-memory test as `128 * N * r`.
For this profile that is 8,388,608 bytes (8 MiB). The fixed 16 MiB `maxmem`
guard is twice the nominal cost and near one eighth of Workers' 128 MB isolate
ceiling, leaving roughly seven eighths outside the documented per-call allowance
for V8, application state, native/runtime overhead, and other requests. The prior
profile allowed 32 MiB per call and failed despite a nominal 16 MiB estimate;
the new guard and nominal cost are each halved.

This arithmetic establishes a materially larger safety margin, not proof.
Cloudflare's limit is isolate-wide, native implementation behavior is not fully
observable, and the prior estimate failed live. Exactly one derivation may run
per isolate and deployed evidence remains mandatory.

The higher `p = 10` may use similar or greater CPU than `p = 5`. Workers Paid is
required. Acceptance records CPU and wall time separately and rejects
`exceededResources` without guessing whether it means CPU or memory. Raising
the CPU setting is permitted only after category-specific `exceededCpu`
evidence and a reviewed operational decision; it is not the response to the
current generic outcome.

### Operational complexity

The implementation remains local to the Worker and D1, with no new dependency,
secret, network hop, or vendor. Existing admission and coordinator boundaries
remain useful. The main operational burden is a new verifier/policy version,
reworked acceptance route, deployment metrics inspection, and ongoing runtime
compatibility monitoring.

### Verifier format, migration, and upgrade

New rows use canonical unpadded base64url in:

`v3$scrypt$ln=13,r=8,p=10,dk=32$<salt-base64url>$<hash-base64url>`

The parser allowlists the exact field order and values and requires 16 decoded
salt bytes and 32 decoded derived-key bytes. `maxmem` is fixed by the `v3`
verifier and is not stored or attacker-controlled.

No live migration is required because preview has zero users. Experimental
local databases may be recreated. The registry remains version-dispatched so a
future native Argon2id, stronger scrypt policy, or external provider can be
introduced without changing the column or forcing resets for formats that the
active runtime can safely verify. The Worker must not execute incompatible
`v1$pbkdf2-sha256` or `v2$scrypt` work. If such a row appears in durable data,
deployment is blocked pending reset or a separately reviewed capable migration
service; hashes cannot be translated without plaintext.

On successful verification of any future supported non-current format, rehash
with a fresh salt and compare-and-swap the old value. Never downgrade a stronger
hash for runtime convenience.

### Dummy work, non-enumeration, and failure behavior

Unknown users and unusable stored records perform one current-policy `v3` dummy
derivation after admission. Admission remains before account lookup. A saturated
known/unknown login and used/unused registration return byte-equivalent `503
AUTH_BUSY`, `Cache-Control: no-store`, and `Retry-After: 1`, with no lookup,
write, or derivation. Real, dummy, creation, rehash, and password-confirmation
work share the one controller.

Native failures release the permit in `finally`, perform no auth mutation, and
return generic `503 AUTH_UNAVAILABLE`; they never fall back to PBKDF2 or weaker
scrypt. Platform-generated failures fail acceptance because application code
cannot reliably translate them.

### Preview acceptance

Before implementation review, the pinned Workers Paid preview must prove:

1. Fixed vectors match Node for the exact `v3` policy; malformed, wrong, and
   unsupported values fail closed.
2. Each protected capability invocation performs exactly one real derivation.
   It holds the permit at a barrier, rejects a second acquisition before KDF
   work, completes the derivation, and returns the active count to zero.
3. At least ten contention rounds and at least 50 timed derivations run as
   separate client-serialized invocations. The harness must not accumulate
   multiple benchmark derivations inside one HTTP invocation.
4. Derivation p95 is below 1,000 ms. Server-measured registration, login, and
   authenticated confirmation p95 is below 1,250 ms for each flow. Record
   client latency separately.
5. Real sequential registration, session restoration/rotation, login,
   confirmation, wrong-password, unknown-user, and unusable-hash paths pass;
   only canonical `v3$scrypt` rows are created.
6. Saturated known/unknown login and used/unused registration coordinator pairs
   are byte-equivalent and perform zero lookups, writes, and KDF starts.
7. Record deployment version, compatibility date, Workers plan, configured CPU
   setting, proof window, p50/p95 timings, and whether peak-memory telemetry is
   available, without credential or identifier data.
8. Metrics/logs contain no `exceededResources`, `exceededMemory`, `exceededCpu`,
   error 1102, cancellation, timeout, Worker error, or unexpected 5xx. A generic
   resource outcome is not relabeled without category-specific evidence.
9. Read-only D1 preflight is zero. Cleanup and read-only postflight prove zero
   acceptance users, profiles, sessions, and related rows. A completed real
   flow is still required; clean data alone is not acceptance.
10. The route is secret-protected and preview-only, returns only sanitized
    counters/configuration/timings, and remains `404` in production even with a
    token.

Any failure blocks the slice and activates Option C, not another parameter
reduction.

## Option B — PBKDF2 at the Workers-supported ceiling (evaluated, rejected)

### Security rationale and offline resistance

The only evidenced deployable candidate is PBKDF2-HMAC-SHA-256 at 100,000
iterations with a 16-byte random salt and 32-byte result. PBKDF2 is standardized
and deliberately CPU-expensive, but it is not memory-hard and is efficient on
parallel cracking hardware. The observed Workers ceiling is one sixth of
OWASP's current 600,000-iteration HMAC-SHA-256 guidance. The application's
12-character minimum and online rate limits do not repair that offline deficit.
A pepper could add defense against a D1-only disclosure but would add secret
rotation/recovery duties and would not restore the missing work factor after a
Worker-secret compromise.

This option is runtime-viable but not an acceptable current security policy, so
it is not selected merely for convenience.

### Workers runtime, memory, and CPU

The deployed capability discovery established that Workers rejects iteration
counts above 100,000 and supports 100,000. PBKDF2 has small, bounded memory use
and would fit comfortably within 128 MB. Its CPU cost is materially lower than
600,000 iterations and is expected to fit Paid Workers, but the reduced cost is
also the offline attacker's advantage.

### Operational complexity

PBKDF2 would be a local Worker implementation with low memory and no external
service. A pepper would require a separate secret binding, rotation versions,
backup/recovery policy, and an outage mode. Those benefits and costs do not
justify selecting a below-guidance base KDF here.

### Format, migration, dummy work, failure, and acceptance

If a future review explicitly accepts this tradeoff, reserve a new policy
version such as
`v4$pbkdf2-sha256$i=100000,dk=32$<salt-base64url>$<hash-base64url>`; do not reuse
experimental `v1`. Version dispatch, fresh-salt compare-and-swap upgrades,
current-policy dummy work, admission-before-lookup, generic `AUTH_BUSY` and
`AUTH_UNAVAILABLE`, and no fallback would remain. With no live users, migration
would recreate preview rows; a future live migration would rehash only after a
successful plaintext verification.

Acceptance would require fixed vectors, strict parsing, exactly 100,000
iterations in real and dummy flows, separate-invocation latency/CPU metrics,
non-enumeration, real auth/session/confirmation flows, platform-error checks,
and clean D1 pre/postflight. These criteria are documented for completeness and
are not authorization to implement PBKDF2.

## Option C — external identity or dedicated hashing runtime (required fallback)

### Security rationale and offline resistance

A managed identity provider or dedicated backend can use Argon2id or another
current password-storage policy without the Workers isolate constraint. OWASP
prefers Argon2id and recommends scrypt when Argon2id is unavailable. This option
can therefore provide stronger and more tunable offline resistance than either
local fallback, subject to provider configuration and evidence.

### Runtime, memory, and CPU

The Worker would not allocate KDF memory or spend KDF CPU. A dedicated service
must publish and enforce its own memory/CPU concurrency limits; moving the work
does not remove resource engineering. The Worker must use authenticated,
encrypted service communication with bounded timeouts and must never log
password-bearing requests. A managed provider should expose standards-based
OIDC/session or token validation rather than returning password hashes.

### Operational complexity

This has the highest complexity: vendor/security assessment, availability and
latency dependency, secrets or signing-key rotation, monitoring, incident and
outage procedures, privacy/data-processing review, cost, account lifecycle,
and local-development strategy. A dedicated backend additionally requires
patching, scaling, deployment, and backup ownership. These costs are justified
only if Workers cannot provide the accepted local security baseline.

### Migration, versioning, non-enumeration, and failure

There are currently no live accounts, so provider adoption would not require
password migration. D1 users would reference an immutable external subject and
would not store a local password hash, or a dedicated backend would retain its
own strict versioned format, for example an allowlisted PHC Argon2id string. The
Worker treats a managed provider's credential representation as opaque and
never stores or parses it. A dedicated backend owns parsing bounds and
constant-time verification. Future migrations must use provider-supported
import only when equivalent security is proven; otherwise users reauthenticate
or reset. Policy upgrades are provider-controlled or occur after successful
verification in the dedicated backend; neither path sends derived material to
the Worker.

Unknown-user, wrong-password, unavailable-account, and provider rejection must
remain indistinguishable at the public login boundary. Provider-specific
errors, subjects, tokens, and request bodies are excluded from public responses
and logs. A managed provider must document equivalent anti-enumeration behavior;
a dedicated backend performs current-policy dummy work for absent/unusable
records behind its own admission boundary. Timeouts and service failures map to
generic `503 AUTH_UNAVAILABLE` and create no local session or account mutation.
Abuse controls apply both at the edge and provider/backend.

### Preview acceptance

Acceptance must cover configured KDF/provider policy evidence, authenticated
service boundaries, fixed or provider test vectors where available, complete
register/login/session/confirmation/logout flows, non-enumeration, timeout and
dependency failures, key/secret rotation, latency objectives, provider/runtime
metrics and errors, no credential logging, cleanup, and D1/provider postflight.
The architecture and vendor/backend choice require a separate amendment and
review; Amendment 03 does not authorize implementation of Option C.

## Preserved invariants

- Password hashes remain explicitly versioned for future stronger schemes.
- No fast general-purpose password hash.
- No silent fallback or parameter reduction.
- One isolate-local permit, zero queue, and admission before identifier lookup.
- Real, dummy, creation, confirmation, and upgrade work use one policy and one
  failure boundary.
- No credential, salt, hash, derived key, session secret, or account identifier
  in public errors or telemetry.
- No production launch until the selected design passes deployed-preview
  acceptance and implementation review.
- `auth-session-api` remains paused until Design Review 06 and a new explicit
  design-approval gate complete.

## Design-review scope

Design Review 06 must verify the Paid-run evidence and the refusal to infer a
CPU-limit failure; the 8 MiB/16 MiB memory rationale against the shared 128 MB
ceiling; the security equivalence claim for OWASP's listed scrypt profiles; CPU
and native-runtime uncertainty; one-derivation-per-invocation acceptance shape;
format and incompatible-row handling; dummy/non-enumeration and failure paths;
the PBKDF2 rejection; and the mandatory external-runtime fallback. It must also
check the authoritative design for contradictions and confirm that no
application implementation is authorized yet.

## Sources consulted

- Cloudflare Workers limits (Paid CPU and shared 128 MB isolate memory):
  <https://developers.cloudflare.com/workers/platform/limits/>
- Cloudflare Workers metrics and invocation outcomes:
  <https://developers.cloudflare.com/workers/observability/metrics-and-analytics/>
- Cloudflare Workers native `node:crypto` support and Argon2 exclusion:
  <https://developers.cloudflare.com/workers/runtime-apis/nodejs/crypto/>
- Node.js `crypto.scrypt` and `crypto.pbkdf2` APIs:
  <https://nodejs.org/api/crypto.html>
- OWASP Password Storage Cheat Sheet:
  <https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html>
