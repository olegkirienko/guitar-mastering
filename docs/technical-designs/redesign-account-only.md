# Redesign and account-only access

## Goal and non-goals

Goal:
- `/` is a public course presentation for everyone, with one call to action, "Перейти до курсу".
- Everything else needs an account. A guest who presses the CTA goes to sign-in or registration.
- After registration the learner lands on Lesson 1. After sign-in, or on the CTA when already signed in, they land where they stopped.
- Lesson progress and lesson preferences live only on the server. Nothing is kept in `localStorage`.
- A learner can return to any lesson and any step they have already reached.
- The visual style becomes "warm studio": cream surfaces, the existing terracotta brand, serif display headings, and self-hosted fonts.

Non-goals:
- No new lessons or lesson content changes.
- No dark mode.
- No offline mode. Without the server, the lessons are unavailable.
- No import of old guest progress, since guests can no longer use the lessons.
- No change to auth mechanics: cookie sessions, `server/auth.ts`, and the origin and JSON checks all stay as they are.

## Current state

- **Routes** (`src/router.tsx`):
  - `/`, `/lessons/01`, `/lessons/02` and `/account`, with no guards.
  - The current step is not in the URL; pages render `progress.currentStepId`.
- **Progress** (`src/progress/**`):
  - Guests use `localStorage` keys. Signed-in learners also use a per-user cache plus a sync to `PUT /api/v1/progress/:lessonId` through `ProgressSyncQueue`, with revisions and 409 handling.
  - Preferences (`audioEnabled`, `prefersStatic`) are stored only in `localStorage`.
  - `mergeProgress` keeps the furthest `currentStepId`, so going back is lost on reload.
- **UI:**
  - `lesson-progress-panel` explains device copies, guest import and cache clearing.
  - Inter is declared but never loaded: CSP has `font-src 'self'` and the repository has no font files.

## Design

### Routes and access

| Path | Access | Purpose |
|---|---|---|
| `/` | public | landing page |
| `/auth` | guests; a signed-in user is redirected to the resume path | sign-in and registration |
| `/course` | account | lessons, their steps, and status |
| `/lessons/:lessonId/:stepId` | account | one lesson step |
| `/account` | account | profile, preferences, sign-out, deletion |
| `/lessons/:lessonId` | account | redirects to the lesson's `currentStepId` |
| `*` | — | redirects to `/` |

`RequireAuth` is a pathless layout route inside `RootLayout`:
- `loading`: a skeleton.
- `guest`: `<Navigate to="/auth?next=<path>" replace>`.
- `unavailable`: a "server unavailable" screen with a retry button.

`/auth` accepts `next` only when `isSafeNext(next)` passes. Otherwise `next` is ignored. `isSafeNext` is a pure function:
- reject values containing a backslash, a control character, or `%2f`/`%5c` in any case;
- parse with `new URL(next, location.origin)` and require the same origin;
- require a pathname matching a protected route pattern; `/auth` and `/` are excluded, so there is no loop;
- keep only the pathname and drop the query and hash.

Navigation uses the router (`navigate(path, { replace: true })`), never `location.href`.

After a successful auth:
- **register:** go to `/lessons/01/intro`.
- **login:** go to `next` if present, otherwise to `resolveResumePath()`.

### Resume path

`resolveResumePath(items, lessonOrder)` is a pure function in `src/progress/core/utils/` that runs on the result of the existing `GET /api/v1/progress`. Because every step view bumps `updatedAt`, revisiting a finished lesson must not move the learner on. Rules, in order:
1. Among lessons without `completedAt`, pick the item with the newest `updatedAt` and return `/lessons/<id>/<currentStepId>`.
2. Otherwise, if some lesson in `lessonOrder` has no item yet and the lesson before it is completed, return the first such lesson's `/intro`.
3. Otherwise, when every available lesson is completed, return the newest item's `/lessons/<id>/<currentStepId>`.
4. With no items, return `/lessons/01/intro`.

Example: L1 is complete and L2 is in progress. Reopening an L1 step bumps L1's `updatedAt`, but L1 is completed, so rule 1 still resumes L2 at its own `currentStepId`.

It is used in three places: the landing CTA for signed-in users, the `/auth` redirect, and the "Продовжити" button on `/course`.

### Step access

A step is reachable when it is `intro`, or when the step before it is in `completedStepIds`. `complete` additionally requires `checkpointPassed`. This is the rule already implemented by `normalize*Progress` and `highestUnlockedStep`; it becomes one exported `isStepReachable(progress, stepId)` per lesson adapter.

- Lesson N+1 is reachable when Lesson N has `completedAt`. Lesson 1 is always reachable.
- The lesson gate reads `GET /api/v1/progress`, which covers all lessons, through a `useCourseProgress` hook shared by `/course`, the lesson route and the CTA. The lesson route renders a skeleton until both the gate data and the lesson's own progress have loaded, so nothing flashes or redirects early.
- Unknown ids and unreachable targets redirect with `replace`:
  - an unknown `:lessonId` goes to `/course`;
  - an unknown `:stepId`, or an unreachable step, goes to the highest reachable step;
  - an unreachable lesson goes to `/course`.
- Reach is enforced on the client only. The server `PUT` accepts any catalog step, which is acceptable because the data belongs to the learner who writes it.
- Opening a step writes it as `currentStepId`. That is the "position"; `completedStepIds` is the "reach".
- `mergeProgress` keeps the union of `completedStepIds`, ORs `checkpointPassed`, and keeps the earliest `completedAt`. For `currentStepId` it now takes the local value, because the latest action wins, instead of the furthest step. That is the only merge change.
- The server's progress validation and format are unchanged, so no progress migration is needed.

### Progress data on the client

`useLessonProgress` becomes server state with no storage:
1. On mount it calls `GET /progress/:lessonId`. On 404 `PROGRESS_NOT_FOUND` it starts from the lesson default at revision 0.
2. State lives in React only. Every change, including a step open, is queued in the existing `ProgressSyncQueue`. The queue keeps only the latest value and runs one upload at a time with `baseRevision`, so rapid step changes coalesce into at most one in-flight write plus one pending write. A 409 merges with `current` and retries once, as today. With two tabs, the newer step open wins.
3. The status is `pending`, `synced` or `error`, with the existing `retry`. If a save fails, the lesson stays usable in memory, and a banner says progress is not saved yet and offers the retry.

Removed:
- `utils/storage*.ts`, the storage keys and constants, guest import, account cache clearing, `storageAvailable`, and the guest and device texts of `lesson-progress-panel`.

The panel keeps one status line and the retry button.

A one-time cleanup runs once in `main.tsx`: it removes every `localStorage` key that starts with `guitar-mastering:`, wrapped in try/catch. It stays for at least one release, then is deleted.

### Preferences on the server

Migration `002_user_preferences`:

```sql
CREATE TABLE user_preferences (
  user_id uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  audio_enabled boolean NOT NULL DEFAULT false,
  prefers_static boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now()
);
```

API contract:
- `GET /api/v1/session` user gains `preferences: { audioEnabled: boolean, prefersStatic: boolean }`. When there is no row, it returns the defaults above.
- `PUT /api/v1/preferences` takes the body `{ audioEnabled: boolean, prefersStatic: boolean }`, both required, no other keys. It upserts the row and returns `{ preferences }`.
  - It uses the same origin, JSON content-type, session and error mapping as `server/auth-routes.ts`.
  - Errors: 400 `VALIDATION_ERROR`, 401 `UNAUTHENTICATED`.
  - The response sends `Cache-Control: no-store`.
- **Server wiring:**
  - `PUT /preferences` is added to the method allowlist in `server/app.ts`; other methods return 405.
  - The preferences router is mounted after the auth router, so the origin and JSON checks in `auth-routes.ts` apply to it.
- On the client, `useAuth` exposes `preferences` and `updatePreferences`. Lessons read them instead of `progress.audioEnabled` and `progress.prefersStatic`.
- A system `prefers-reduced-motion` still forces static mode.

### Lesson step navigator

`lesson-shell` gains a step list built from the lesson's step IDs and titles:
- On desktop it is a side column; on mobile it collapses into a disclosure at the top.
- Reachable steps are links. Unreachable steps are `aria-disabled` with the reason "Спершу пройди попередній крок".
- The current step has `aria-current="step"`.
- The existing Back and Next buttons stay, and they navigate by URL.

`/course` lists each lesson with the same step list, a status badge, and "Продовжити".

### Visual redesign

- **Tokens** in `src/styles/theme.css`: a cream scale for `bg-primary`, `bg-secondary` and `border-*`. `brand-*` (terracotta) stays. Contrast stays at WCAG AA, checked on text tokens over cream.
- **Fonts:** self-hosted WOFF2 files in `src/assets/fonts`, imported from CSS so Vite fingerprints them into `dist/assets`, the path the server caches as immutable:
  - Inter, variable, Latin and Cyrillic;
  - Source Serif 4, variable, Latin and Cyrillic, SIL OFL, used for `--font-display`.

  Both use `font-display: swap`, and the existing CSP `'self'` already allows them. Total added weight is about 300 KB or less, cached and immutable.
- **`app-layout`:** a logo mark; "Курс"; and either an Untitled UI avatar dropdown with Акаунт and Вийти, or "Увійти". The version pill goes away.
- **Landing (`/`):**
  1. A hero with the serif headline and the CTA.
  2. "Як ти вчишся": Слухай, Пробуй, Грай, taken from the course tracks.
  3. "Шлях курсу": the 8 stages from `docs/course-map/README.md`, with the available lessons marked.
  4. "Що потрібно": a guitar or none, and 15 to 20 minutes per lesson.
  5. A final CTA.
- Components come from Untitled UI through the MCP and the pinned CLI; a component is hand-rolled only when Untitled UI has none.
- The line-height override removal (local commit `b5eb194`) is included, and `.claude/skills/untitled-ui/SKILL.md` drops its note about the overrides.

## Security and privacy

- Lesson and progress data are reachable only with a session. The server already enforces this for `/progress`, and `/preferences` follows the same rule.
- `next` is validated as an internal route path, so no open redirect is possible.
- No data is left in browser storage: the cleanup removes existing keys, and an e2e test asserts that `localStorage` is empty after a lesson.
- Preferences are deleted with the account by `ON DELETE CASCADE`.
- New font files are first-party static assets, so CSP needs no change.

## Migrations, deployment, rollback

- `002_user_preferences` is additive and runs through the existing migration step before startup. Like `001_baseline.cjs`, it is forward-only (`exports.down = false`), and `db:migrate` only runs `up`.
- **Order:** the server PR with the migration ships first. The client PRs only start using the new fields after it is delivered.
- **Rollback:**
  - Server PR: revert the code and leave the table in place, unused. Dropping the table is a manual step that is not needed for rollback, and it needs owner approval as a production mutation.
  - Routes PR: revert the merge commit. Lessons become open again, with local progress as before.
  - Server-only progress PR: revert the merge commit. Keys removed by the cleanup are gone, so learners without an account start fresh. Signed-in learners keep their server progress.

## Test strategy

- **Unit tests:**
  - `resolveResumePath`, including revisiting a finished lesson while the next one is in progress, all lessons completed, and no items;
  - `isSafeNext`, as a table: `//x`, `/\x`, `/%2f%2fx`, `https://x`, `javascript:alert(1)`, `/auth`, `/`, `/lessons/01/air?x#y` (which becomes the bare path), and `/lessons/99/x`;
  - `isStepReachable` for both lessons;
  - the new `mergeProgress` rule for `currentStepId`;
  - the preferences body validator.
- **Server:**
  - route tests for `PUT /preferences`: origin, content type, validation, 401, 405 for other methods, `no-store`, and the session payload;
  - integration tests (`test:postgres`) for the upsert and the cascade;
  - a migrations integration test showing that `002` applies once and stays idempotent under concurrent runs.
- **E2E:**
  - Replace `seedStep` and `storedProgress` in `e2e/lesson-two.spec.ts` and `e2e/account-profile.spec.ts` with a `page.route` mock of `/api/v1/progress` that stores the state in memory.
  - New flows:
    - a guest on `/lessons/01/air`, `/course` or `/account` goes to `/auth?next=…` and never sees lesson content;
    - direct deep links: an unknown lesson goes to `/course`, and an unknown or unreachable step goes to the highest reachable step, with no content flash;
    - registration leads to `/lessons/01/intro`;
    - sign-in with progress leads to the resume path;
    - on `/course`, a reached step opens and an unreached one is disabled;
    - reload keeps the step;
    - browser Back goes to the previous step;
    - `localStorage` has length 0 after a lesson;
    - there is no horizontal scroll at 320 px on `/`, `/course` and a lesson.
- **Delivery:** `smoke:production` keeps working, because `/` and `/lessons/01` serve the SPA with 200.

## Slices (four PRs after approval, in this order)

The order ensures guests are locked out (PR 2) before local progress is removed (PR 3), so no release leaves guests in lessons that cannot save.

1. **Server preferences:** the forward-only migration, `preferences` in the session, `PUT /preferences` with its allowlist and mount order, and tests.
   - Accept when test, `test:postgres` (including the `002` migration integration test) and build are green, and delivery is verified.
2. **Routes and navigation:**
   - `/auth` with `isSafeNext`, `RequireAuth`, `/course`;
   - step URLs, `useCourseProgress`, `resolveResumePath`;
   - the step navigator, the merge rule, and redirects after auth.

   Progress storage is unchanged in this PR. Signed-in learners already sync to the server, and guests can no longer reach lessons.
   - Accept when the new e2e flows pass and guests reach only `/` and `/auth`.
3. **Server-only progress on the client:**
   - the storage-free `useLessonProgress`;
   - preferences read from `useAuth`;
   - the key cleanup and the simplified panel;
   - the e2e mocks.

   Accept when all lesson e2e pass on mocked progress and `localStorage` is empty.
4. **Visual redesign:** tokens, fonts, layout, landing, lesson-shell styling, `b5eb194`, and the `SKILL.md` note.
   - Raw `gray-*` and `white` classes outside the Untitled UI CLI-owned folders move to semantic tokens, so the cream scale reaches the lesson internals too (owner's choice during implementation).
   - Accept when the pages render in the new style, contrast is AA, there is no horizontal scroll at 320 px, and all e2e pass.
