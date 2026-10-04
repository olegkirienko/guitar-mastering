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

`/auth` accepts `next` only when it is an internal path. It must start with a single `/`, must not start with `//`, and must match a known route pattern. Otherwise `next` is ignored, so the parameter cannot be used as an open redirect.

After a successful auth:
- **register:** go to `/lessons/01/intro`.
- **login:** go to `next` if present, otherwise to `resolveResumePath()`.

### Resume path

`resolveResumePath(items)` is a pure function in `src/progress/core/utils/` that runs on the result of the existing `GET /api/v1/progress`:
- It picks the item with the newest `updatedAt` and returns `/lessons/<id>/<currentStepId>`.
- If that lesson has `completedAt` and a next lesson exists, it returns `/lessons/<next>/intro`.
- With no items, it returns `/lessons/01/intro`.

It is used in three places: the landing CTA for signed-in users, the `/auth` redirect, and the "Продовжити" button on `/course`.

### Step access

A step is reachable when it is `intro`, or when the step before it is in `completedStepIds`. `complete` additionally requires `checkpointPassed`. This is the rule already implemented by `normalize*Progress` and `highestUnlockedStep`; it becomes one exported `isStepReachable(progress, stepId)` per lesson adapter.

- Lesson N+1 is reachable when Lesson N has `completedAt`. Lesson 1 is always reachable.
- A URL for an unreachable step redirects, with `replace`, to the highest reachable step.
- Opening a step writes it as `currentStepId`. That is the "position"; `completedStepIds` is the "reach".
- `mergeProgress` keeps the union of `completedStepIds`, ORs `checkpointPassed`, and keeps the earliest `completedAt`. For `currentStepId` it now takes the local value, because the latest action wins, instead of the furthest step. That is the only merge change.
- The server's progress validation and format are unchanged, so no progress migration is needed.

### Progress data on the client

`useLessonProgress` becomes server state with no storage:
1. On mount it calls `GET /progress/:lessonId`. On 404 `PROGRESS_NOT_FOUND` it starts from the lesson default at revision 0.
2. State lives in React only. Every change is queued in the existing `ProgressSyncQueue` with `baseRevision`. A 409 merges with `current` and retries once, as today.
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
- **Fonts:** self-hosted WOFF2 files in `public/fonts`:
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

- `002_user_preferences` is additive and runs through the existing migration step before startup. Its down migration drops the table.
- **Order:** the server PR with the migration ships first. The client PRs only start using the new fields after it is delivered.
- **Rollback:**
  - Client PRs: revert the merge commit. Old clients stop using `localStorage` only after the cleanup release. A rollback before then restores local behavior; after it, guests start fresh, which is acceptable.
  - Server PR: revert the code. The table may stay, unused.

## Test strategy

- **Unit tests:**
  - `resolveResumePath`;
  - `next` validation;
  - `isStepReachable` for both lessons;
  - the new `mergeProgress` rule for `currentStepId`;
  - the preferences body validator.
- **Server:** route tests for `PUT /preferences` (origin, content type, validation, 401) and the session payload; an integration test for the upsert and the cascade (`test:postgres`).
- **E2E:**
  - Replace `seedStep` and `storedProgress` in `e2e/lesson-two.spec.ts` and `e2e/account-profile.spec.ts` with a `page.route` mock of `/api/v1/progress` that stores the state in memory.
  - New flows:
    - a guest on `/lessons/01/air` goes to `/auth?next=…`;
    - registration leads to `/lessons/01/intro`;
    - sign-in with progress leads to the resume path;
    - on `/course`, a reached step opens and an unreached one is disabled;
    - reload keeps the step;
    - browser Back goes to the previous step;
    - `localStorage` has length 0 after a lesson;
    - there is no horizontal scroll at 320 px on `/`, `/course` and a lesson.
- **Delivery:** `smoke:production` keeps working, because `/` and `/lessons/01` serve the SPA with 200.

## Slices (four PRs after approval, in this order)

1. **Server preferences:** the migration, `preferences` in the session, `PUT /preferences`, and tests.
   - Accept when test, `test:postgres` and build are green, the migration applies and rolls back locally, and delivery is verified.
2. **Server-only progress on the client:**
   - the storage-free `useLessonProgress`;
   - preferences read from `useAuth`;
   - the key cleanup and the simplified panel;
   - the merge rule;
   - the e2e mocks.

   Accept when all existing lesson e2e pass on mocked progress and `localStorage` is empty.
3. **Routes and navigation:** `/auth` with `next`, `RequireAuth`, `/course`, step URLs, `resolveResumePath`, the step navigator, and redirects after auth.
   - Accept when the new e2e flows pass and guests reach only `/` and `/auth`.
4. **Visual redesign:** tokens, fonts, layout, landing, lesson-shell styling, `b5eb194`, and the `SKILL.md` note.
   - Accept when the pages render in the new style, contrast is AA, there is no horizontal scroll at 320 px, and all e2e pass.
