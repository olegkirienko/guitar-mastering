# Design Review 01 — Authentication and persistence foundation

## Review metadata

- **Work item:** `feature-auth-persistence`
- **Work-item type:** `technical_feature`
- **Design artifact:** `docs/technical-designs/feature-auth-persistence.md`
- **Workflow phase reviewed:** `design_review`
- **Date:** 2026-09-11
- **Verdict:** `CHANGES REQUIRED`

## Summary

The design has a sound overall direction. Same-origin Worker APIs, opaque
server-side sessions, D1 relational constraints, local-first lesson behavior,
optimistic progress revisions, account-scoped browser caches, additive
migrations, and staged operational hardening fit the product and current codebase.
The goals and non-goals are clear, the six slices mostly have coherent ownership,
and the design avoids both a premature lesson engine and unnecessary server
framework abstraction.

The design is not ready for implementation approval because an authenticated
client can create an unbounded number of progress rows, and the ordered rollout
would publish account UI to the current GitHub Pages origin before its same-origin
API exists. Two further contradictions leave registration-enumeration and session
lifecycle behavior without a deterministic contract. These issues cross security,
data integrity, API behavior, and deployability, so they must be resolved in the
authoritative design before the first implementation slice begins.

## Blocking findings

### HIGH-01 — Progress storage is bounded per payload but unbounded per account

**Evidence**

- The primary key is `(user_id, lesson_id)`, while the Worker validates only the
  lesson-ID format, envelope version, JSON shape, scalar/array limits, and bytes.
- The browser is explicitly untrusted, but lesson-specific known-step validation
  is assigned only to client adapters.
- Only registration and login receive abuse-rate controls. Progress mutation has
  no per-user quota or rate control, and `GET /progress` returns the full set.

**Impact**

Any authenticated account can submit arbitrarily many distinct syntactically
valid lesson IDs, consuming D1 storage and write capacity and making the unpaged
collection response grow without bound. The 12 KiB record cap does not bound the
number of records. This violates the design's bounded-storage premise and creates
a straightforward denial-of-wallet/data-exhaustion path.

**Required revision**

Define a server-enforced bound. For the current product, prefer a versioned
allowlist/catalog of supported lesson IDs and reject unknown IDs with a specified
status/error code. If forward-compatible arbitrary IDs are required, instead
specify an enforceable per-user record quota, progress-write abuse control, and a
bounded/paginated collection contract. Add integration cases for unknown/excess
lesson IDs and bounded collection reads, and assign the controls to an explicit
implementation slice.

### HIGH-02 — The slice rollout publishes nonfunctional account features before the API origin exists

**Evidence**

- The current `.github/workflows/deploy.yml` deploys every push to `main` to
  GitHub Pages, which is the current canonical production origin.
- The architecture requires relative, same-origin `/api/v1/*` calls served by the
  Cloudflare Worker and intentionally does not define a cross-origin API mode.
- Slice 3 adds public registration/login/profile/navigation entry points and
  slice 5 integrates progress sync, while only slice 6 performs the production
  Worker cutover and disables or removes the GitHub Pages production deploy.
- The design says to keep GitHub Pages during staged rollout but does not define
  a build-time/runtime gate, preview-only exposure, or other mechanism preventing
  those controls from appearing on the API-less Pages deployment.

**Impact**

Merging the independently reviewed slices to `main` can expose account controls
that consistently fail at the advertised production site. Later, changing the
Vite base to `/` while Pages remains an active deploy target can also overwrite
the usable Pages fallback with an artifact whose root-relative assets do not work
under `/guitar-mastering/`. The current slice ordering therefore does not produce
safe, independently deployable increments.

**Required revision**

Specify one complete pre-cutover release strategy and reflect it in slice
ownership and acceptance criteria. For example, keep auth/profile/sync UI behind
an explicit production capability flag while enabling it on the Worker preview,
then atomically enable it and change the base when the Worker becomes canonical;
or move the production-origin scaffold/cutover earlier while retaining a
documented static fallback. State exactly when the Pages workflow is disabled,
how its last known-good artifact is preserved, and how each pre-cutover slice is
verified not to expose broken account functionality on the current canonical
origin.

### MEDIUM-01 — Registration behavior contradicts the no-enumeration requirement

**Evidence**

- The API contract defines `409` for a username conflict and illustrates a
  field-level `USERNAME_UNAVAILABLE` error.
- The abuse-controls section says not to expose whether a named account exists,
  without limiting that rule to login and rate-limit responses.
- A unique username is the sole login identifier, so availability feedback during
  open registration is itself an account-existence oracle unless the contract
  intentionally accepts and scopes that disclosure.

**Impact**

An implementer cannot simultaneously provide the specified registration conflict
and satisfy the stated non-enumeration rule. Different slices/tests may encode
opposite expectations, leaving a security-sensitive API behavior to ad hoc
interpretation.

**Required revision**

Choose and document one policy. The likely MVP policy is to explicitly accept
username-availability disclosure at registration while requiring indistinguishable
unknown-user/wrong-password responses for login and neutral responses for rate
limiting. If registration must also resist enumeration, redesign its response and
user flow accordingly. Align the error table, example codes, abuse wording, and
tests.

### MEDIUM-02 — Cookie persistence and login rotation do not define one session lifecycle

**Evidence**

- Server session rows have a 30-day absolute expiry, but the specified session
  cookie attributes omit both `Max-Age` and `Expires`; that produces a browser
  session cookie rather than a defined 30-day persistent login.
- Browser tests require a “restored session,” but the design does not state
  whether restoration must survive a browser restart.
- “Rotate the session on every successful login” does not say whether a valid
  session token already supplied with the login request is deleted, retained as
  another active session, or counted only through the ten-session cap.

**Impact**

Clients and tests can implement materially different persistence behavior, and a
login performed while already authenticated can leave the replaced token usable,
contrary to the usual security meaning of rotation. Cookie and database expiry
may also diverge without a defined clock/skew rule.

**Required revision**

Define whether login is browser-session-only or persistent across restarts. If
persistent, set an explicit cookie `Max-Age`/`Expires` no later than the server
row's absolute expiry and specify logout/deletion attributes consistently. Define
the exact handling of an incoming valid session during successful login, including
whether its row is revoked atomically with creation of the replacement. Add tests
for browser restart/expiry and login while a valid session cookie is present.

## Non-blocking recommendation

### LOW-01 — Pin platform prerequisites before the auth slice

The design correctly makes PBKDF2 deployment benchmarking a launch condition and
recognizes that Worker rate limiting is permissive and location-local. During the
revision, record the intended Workers plan/CPU limit and pin a Wrangler version
that supports the selected static-asset routing and rate-limit binding features.
Current Cloudflare documentation requires Wrangler 4.20+ for array-valued
`assets.run_worker_first` and 4.36+ for the Rate Limiting API. This will turn the
existing feasibility caveat into a reproducible preview acceptance condition.

## Full-design assessment

- **Goal and scope clarity:** Goals, non-goals, privacy boundaries, and the
  distinction between learning continuity and assessment integrity are clear.
- **Architecture and feasibility:** Workers Static Assets plus a selective
  Worker-first `/api/*` path and D1 are proportionate to the expected scale. The
  no-framework route table is appropriate. Official Cloudflare documentation
  supports SPA fallback, selective Worker-first routes, D1 transactional batches,
  enforced foreign keys, and the stated locality/permissiveness of rate limits.
- **Security/auth:** Password hashing, dummy verification, token hashing,
  HttpOnly host cookies, origin enforcement, body limits, prepared statements,
  log redaction, and account-deletion reauthentication are good foundations.
  `MEDIUM-01` and `MEDIUM-02` must make the remaining contracts deterministic.
- **Data integrity and API contracts:** Optimistic revisions, server timestamps,
  conflict responses, cascades, and corruption-tolerant adapters are appropriate.
  `HIGH-01` is the principal missing storage invariant. The initial migration
  should translate every field marked “required” into explicit `NOT NULL`/check
  constraints where applicable and verify those constraints in integration tests.
- **Migrations, deployment, and recovery:** Additive-first migrations, preview
  validation, bookmarks, forward-compatible rollback, and explicit incident-only
  restoration are well scoped. `HIGH-02` is the blocking release-sequencing gap.
- **Privacy:** Data minimization is strong: no email, phone, IP, user agent,
  uploaded avatar, reflection, or transient lesson interaction is persisted.
  Shared-device cache separation, explicit clearing, account deletion, and backup
  retention disclosure are addressed.
- **Validation:** Unit, D1 integration, component/browser, preview security-header,
  failure, accessibility, and regression coverage are unusually complete. The
  required revisions add the few missing adversarial and rollout cases.
- **Slice boundaries and abstraction:** The six ordered slices are generally
  reviewable and avoid speculative frameworks or a universal lesson engine.
  Slice 4's generic transport is justified by the stable API concern; slice 5
  appropriately retains Lesson 1 semantics in its lesson-specific adapter.

## Review conclusion

The architecture should remain the basis of the feature. Resolve `HIGH-01`,
`HIGH-02`, `MEDIUM-01`, and `MEDIUM-02`, and address `LOW-01` if practical, then
submit the revised design for a new immutable design review.

## Verdict and gate recommendation

**Verdict: `CHANGES REQUIRED`**

Do not open the `design_approval` human gate. Return to `phase: design` with
`HIGH-01`, `HIGH-02`, `MEDIUM-01`, and `MEDIUM-02` as active blocking findings.
