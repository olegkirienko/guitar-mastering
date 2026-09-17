# Authentication KDF acceptance thresholds

Status: auth-slice local and Railway preview acceptance passed.

## Foundation measurement

On 2026-09-15, Node v24.7.0 on the local development host completed 50
sequential exact-policy native Argon2id derivations after five warmups with
p50 45.76 ms, p95 75.23 ms, maximum 89.47 ms, and peak process RSS 241.00 MiB.
This proves runtime capability and supplies a local latency baseline; the RSS
figure includes the Node process and is not an incremental KDF measurement.
Railway preview capacity and concurrency evidence is owned by the current
`auth-session-api` slice.

## Required preview gates

The implementation must keep the approved Argon2id policy unchanged and pass
all of these gates in local and Railway preview measurements:

- At least 50 production-shaped derivations after five warmups.
- No process restart, out-of-memory event, fallback algorithm, or event-loop
  starvation above 250 ms.
- Single-derivation p95 at or below 750 ms in preview.
- Two-active-job p95 at or below 1,500 ms, with resident memory remaining below
  80% of the configured Railway service limit.
- A full eight-item queue drains within 8 seconds; a ninth queued item receives
  `503 AUTH_BUSY` before identifier lookup, and new work succeeds after drain.
- Any timeout or thrown KDF operation releases its permit and creates no user or
  session row.

These are launch gates, not permission to weaken the KDF. The auth slice must
record the local and preview service size, Node patch version, p50/p95 latency,
peak memory, event-loop delay, and pass/fail result. If preview misses a gate,
implementation review stops for capacity or architecture review.

## Auth-slice local acceptance

On 2026-09-15, the implemented `v4` service passed the local gate on Node
v24.7.0. After five warmups, 50 sequential production-policy hashes measured
p50 45.87 ms, p95 66.40 ms, and maximum 68.69 ms. Peak process RSS was 240.33
MiB and maximum observed event-loop delay was 37.99 ms. Fifty hashes executed
in two-active pairs measured p50 65.62 ms, p95 79.30 ms, and maximum 84.89 ms.

With two active permits and all eight queue positions occupied, the ten accepted
jobs drained in 352.33 ms, the excess job received `AUTH_BUSY`, and a subsequent
job succeeded. Unit coverage separately proves permit release after thrown work
and shutdown drain behavior.

## Railway preview acceptance

The final acceptance run covered 2026-09-16 07:33–07:44 UTC in the Railway
`preview` environment. It used successful deployment
`fe70bb07-9452-42cc-8cf7-ac5388bf2d98`, application version
`8c502ac4c589-preview`, deployed image digest
`sha256:a2a9121e22c0e6e7e60e25b10ad6ffbf80837f9d64c37ce8e85a521d17ded446`,
Railway V2 runtime, and one `iad` replica. The build log and an in-container
probe both reported Node v24.7.0 on Linux x64. The service allocation observed
by Railway metrics was 2 vCPU and 1,024 MiB memory.

### Exact-policy measurements

The probe ran inside the deployed container against the compiled password
module. It verified the independent fixed vector for
`argon2id/m=19456/t=2/p=1/dk=32`, then completed five warmups and 50 fresh-salt
production-policy hashes. Sequential latency was p50 28.91 ms, p95 37.71 ms,
and maximum 41.92 ms. Fifty hashes run in two-active pairs measured p50
29.89 ms, p95 39.90 ms, and maximum 40.88 ms.

Peak process RSS during the probe was 242.41 MiB (23.7% of the service limit)
and maximum observed event-loop delay was 50.27 ms. Ten admitted jobs (two
active plus eight queued) drained in 162.87 ms; the excess job received
`AUTH_BUSY`, an injected throw released its permit, and subsequent exact-policy
work succeeded. Current-policy dummy work completed in 29.28 ms, and password
confirmation verified successfully. No fallback algorithm or parameter change
was present.

### Real flows, persistence, and cleanup

Public HTTPS acceptance exercised registration, login, wrong-password,
unknown-user, unusable-record, session restoration, incoming-session rotation,
logout/account deletion, secure cookie, origin, no-store, SPA/API, health, and
readiness behavior. Wrong, unknown, and unusable records all returned the same
`401 INVALID_CREDENTIALS` code and message. The unusable-record test performed
current-policy dummy work and created no additional user or session.

An eleven-request public burst completed without filling the bounded queue,
while the deterministic in-container saturation test above proved the full
two-active/eight-queued boundary and `AUTH_BUSY` recovery contract. Varying a
spoofed `X-Forwarded-For` value on every request did not select fresh network
keys: the shared 20-per-minute registration-network threshold still returned
`429 RATE_LIMITED`. Five failed logins were recorded, the web process was
deliberately restarted without rebuilding, and five post-restart failures in
the same fixed window reached the persisted tenth attempt while the following
attempt returned `429 RATE_LIMITED`.

Cleanup deleted all 20 public-flow users plus the isolated unusable-record
user. PostgreSQL postflight counts were zero matching acceptance users, zero
matching sessions, and zero malformed acceptance hashes. Logs contained only
allowlisted structured request/startup fields and no credentials, cookies,
tokens, hashes, database URLs, or raw client addresses.

### Platform inspection and decision

Railway metrics for 07:13:40–07:43:45 UTC included the entire acceptance
window: CPU peaked at 0.122 vCPU; memory peaked at 432.90 MiB (42.3% of the
1,024 MiB limit); 65 HTTP requests produced 45 2xx, 20 expected 4xx, and zero
5xx responses. The active deployment remained `SUCCESS`. The only restart in
the window was the deliberate persistence proof, after which health recovered
and the same deployment version resumed. No OOM, unexplained restart,
unbounded queue, leaked acceptance row, unexpected 5xx, or redacted-data
violation was observed.

Final decision: **PASS**. All KDF latency, memory, event-loop, queue-drain,
failure-recovery, real/dummy/confirmation, ingress, restart-persistence,
cleanup, log, and resource gates passed without weakening the approved policy.
