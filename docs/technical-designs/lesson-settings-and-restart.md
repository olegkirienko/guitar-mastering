# Lesson settings on the account page, and restart from a lesson

## Goal and non-goals

**Goal.** Three changes the owner asked for after walking through Stage I:

1. The motion and sound switches are account-wide preferences, yet every lesson
   page repeats them as a settings bar above every step. They move to the
   account page, and the sound switch survives inside a lesson only as a control
   on the experiment that actually plays sound.
2. The line «Прогрес зберігається в акаунті.» tells the learner nothing they can
   act on. It goes; only the failure state stays.
3. The learner can return to any reached step but cannot start over. Each lesson
   gets «Розпочати урок заново», which resets that lesson and every lesson after
   it, behind a confirmation modal.

**Non-goals.** New lessons or new pedagogy; changing what any experiment teaches;
a progress-schema or migration change; resetting the whole course from one
button; deleting an account (it already removes progress); new dependencies
beyond the Untitled UI modal the CLI generates.

## 1. The motion and sound settings move to the account page

**Problem.** `preferences.prefersStatic` and `preferences.audioEnabled` already
live on the account (`src/auth/auth-provider/types.ts:3`) and are already saved
through `updatePreferences`. Only the surface is wrong: all five lesson pages
hand-roll the same bar (`src/pages/lesson-one-page/lesson-one-page.tsx:21`,
`lesson-two-page.tsx:28`, and the same block in lessons 3–5), so the learner sees
a settings panel on every step of every lesson, and each page duplicates the
markup and the copy.

**Design.** One place to switch them: a new `Уроки` section on the account page,
next to `Вигляд`.

- New unit `src/pages/account-page/components/lesson-preferences/` with
  `lesson-preferences.tsx` and `constants.ts` for the labels and hints. It
  follows `ThemePreference` exactly: read `preferences` from `useAuth`, apply the
  change at once through `updatePreferences`, and render
  `preferencesSaveFailedMessage` in an `aria-live="polite"` line when a save was
  reverted.
- Two `Toggle` controls from `src/components/base/toggle`:
  - «Показувати досліди покадрово» → `prefersStatic`. When the system asks for
    reduced motion the toggle is selected and disabled, with the existing hint
    «Системне налаштування зменшеного руху активне: досліди показуються
    покадрово.» This matches today's disabled button in the lesson bar.
  - «Звук у дослідах» → `audioEnabled`, with the existing note «Звук не
    запускається сам і не потрібен, щоб пройти урок.»
- The media query that drives the first toggle is duplicated today in all five
  lesson hooks (`use-lesson-one-page.ts:25`). It moves verbatim to
  `src/hooks/use-prefers-reduced-motion/use-prefers-reduced-motion.ts`, which the
  five lesson hooks and the new unit all call. `staticMode = prefersReducedMotion
  || preferences.prefersStatic` stays where it is in each lesson hook, because the
  experiments still need it.
- The bar is deleted from all five lesson pages, together with the now-unused
  `preferences` copy in each lesson's content (`motionTitle`, `motionSystem`,
  `motionManual`, `motionSystemLabel`, `motionStaticLabel`, `motionAnimatedLabel`,
  `audioTitle`, `audioNote`, `audioOnLabel`, `audioOffLabel`) and the matching
  fields in `types.ts`. `audioUnavailable` and `audioBlocked` stay: the lesson
  hooks still build `audioMessage` from them.

**Sound inside a lesson.** Removing the bar would leave lessons 2–5 with no way
to turn sound on, so the control moves to where the sound is, as it already works
in `VirtualGuitarString` (`virtual-guitar-string.tsx:54`).

- New unit `src/components/lesson/lesson-audio-toggle/` renders one
  `aria-pressed` button — «Увімкнути звук» / «Вимкнути звук», and «Спробувати
  ввімкнути звук» when the browser blocked it — followed by the `aria-live`
  line that shows `audioMessage`. That live region is the one that sits in the
  deleted bar today (`lesson-two-page.tsx:40`), so it must not be lost with it.
- Every step whose component receives the page's `audio` object renders the
  toggle directly under that component: in lesson 2 the `string`, `repeats`,
  `frequency`, `loudness` and `guitar` steps, and the steps that pass `audio` in
  lessons 3–5. Steps without sound render nothing.
- Lesson 1 keeps its control inside `VirtualGuitarString` and does not gain a
  second one.

**The motion setting lives only on the account page**, with no lesson-side
control and no link to one. Unlike sound, it is chosen once and then holds for
every experiment, the experiments stay fully usable in either mode, and the
system's reduced-motion setting already overrides it without anyone switching
anything. The account page is one click away in the header menu, and the new
value applies to the lesson as soon as the learner returns, because `staticMode`
is read from `preferences` on every render.

## 2. The progress panel keeps only what the learner must act on

**Problem.** `LessonProgressPanel` always prints a status line: «Зберігаємо
прогрес в акаунті…», «Прогрес ще не збережено…», or «Прогрес зберігається в
акаунті.» Two of those three states are noise.

**Design.** The panel renders nothing while saving or when saved. It keeps the
error line with «Спробувати зберегти ще раз», and the `preferencesSaveFailed`
line, since the in-experiment sound toggle still writes a preference from inside
a lesson. Both live regions stay in the tree and stay empty in the happy path, so
a later failure is announced. The props do not change.

## 3. Restart from a lesson

**Problem.** Progress only moves forward. A learner who wants to redo a lesson
can revisit a step but cannot clear what the lesson recorded, and the course page
gates each lesson on the previous one being completed, so a partial redo would
leave later lessons open on stale results.

### Data and API contract

New route, next to the existing progress routes:

```
POST /api/v1/progress/:lessonId/reset  →  200 { items: LessonProgressItem[] }
```

- `401 UNAUTHENTICATED` without a session, `404 UNKNOWN_LESSON` for a lesson id
  outside the catalog, `503 PROGRESS_UNAVAILABLE` on a database failure — the
  same errors `createProgressRouter` already maps.
- It deletes the caller's `lesson_progress` rows for the target lesson and every
  lesson after it in catalog order, in one statement:
  `DELETE FROM lesson_progress WHERE user_id = $1 AND lesson_id = ANY($2)`.
- The order comes from the catalog, not from string comparison:
  `ProgressCatalog` gains `idsFrom(lessonId): string[]`, built from the insertion
  order of `productionProgressCatalog`. Lesson ids keep no ordering guarantee of
  their own.
- The response is the caller's remaining progress, in the shape `GET
  /api/v1/progress` returns, so a caller needs no second request.
- The route is idempotent: resetting a lesson with nothing stored returns 200
  with the remaining items.
- `server/app.ts:101` builds the `Allow` header for a 405; it gains the new path
  with `POST`.

### Client

- `createProgressApi` gains `reset(lessonId): Promise<ProgressItem[]>`, which
  posts to the route and maps failures to `ProgressApiError` like `save` does.
- `ProgressSyncQueue` gains a `stopped` flag and `stop(): Promise<void>`.
  `enqueue` and `retry` return early once stopped, `flush` keeps its current
  promise in a field, and `stop()` resolves when that promise settles. Nothing
  else about the queue changes.
- `useLessonProgress` gains `reset(): Promise<void>` on its controller
  (`src/progress/use-lesson-progress/use-lesson-progress.ts`):
  1. `await queueRef.current?.stop()`, then drop `queueRef.current` so
     `setProgress` cannot enqueue against the queue that is going away;
  2. await `api.reset(adapter.lessonId)`;
  3. bump `bootstrapAttempt` in both the success and the failure path, so the
     existing effect re-reads the lesson from the server and builds a fresh
     queue; on success that read is `PROGRESS_NOT_FOUND`, which the effect
     already turns into default progress at revision 0;
  4. rethrow the failure so the dialog can report it.
  Awaiting `stop()` is what makes the reset safe: no save can be in flight when
  the delete runs, so none can re-create the row afterwards. A guard on the
  revision would not be enough on its own, because a first save for a lesson
  carries `baseRevision === 0` and inserts. The existing `userIdRef` check inside
  `saveRemote` (`use-lesson-progress.ts:39`) stays as it is; it covers an account
  change, not a reset.
- The course page needs no change: `useCourseProgress` loads on mount, so
  returning to `/course` after a reset shows the later lessons locked again.

### The control and the modal

- New unit `src/components/lesson/lesson-restart/` renders a
  `secondary-destructive` button «Розпочати урок заново» and the confirmation
  modal. The modal comes from the Untitled UI CLI through the `untitled-ui`
  skill (`src/components/application/modals/**`); it is backed by
  `react-aria-components`, which is already a dependency, so focus trapping,
  `Esc`, and the backdrop click come with it.
- Modal copy: heading «Розпочати урок заново?», body «Прогрес цього уроку та всіх
  наступних буде скинуто. Пройдені кроки доведеться пройти ще раз.», confirm
  «Скинути прогрес» (`primary-destructive`), cancel «Скасувати». The confirm
  button shows a pending state while the request runs, and a failure renders an
  error line inside the modal with the confirm button still available, so the
  learner can retry without reopening it.
- On success the modal closes, the page navigates to the lesson's first step, and
  focus moves to that step's heading through the `shouldFocus` flag the pages
  already use. Focus returns to the trigger when the learner cancels.
- `LessonShell` takes a new required `onRestart: () => Promise<void>` and renders
  the unit under the step list in the desktop sidebar and inside the mobile
  «Кроки уроку» panel — the same two places the step list already renders. Each
  lesson page passes `async () => { await resetProgress(); goTo(firstStepId); }`.

## Security and privacy

The route reads the session cookie with `readSessionCookie` and resolves the user
through `AuthService`, exactly as the other progress routes do, so a learner can
only delete their own rows; the lesson id is validated against the catalog before
any SQL and is only ever used as a parameter. No new data is stored and nothing
new is logged. The deletion is irreversible by design and is the point of the
feature; the modal is the guard. `docs/technical-designs/redesign-account-only.md`
already tells the learner that progress lives in the account, and the privacy
text on the account page needs no change.

## Migrations, deployment, and rollback

No migration: the change only deletes rows from `lesson_progress`. Deployment is
the ordinary Railway deploy, and the server change is additive, so an older
client works against the new server. Reverting the PR removes the route and the
UI; progress that a learner already reset is not restored, which is the expected
result of a confirmed reset.

## Test strategy

- `server/progress.test.ts`: `reset` deletes the target lesson and the later
  ones, keeps the earlier ones, returns the remaining items, rejects an unknown
  lesson with 404 and a missing session with 401, and is idempotent.
- `server/progress-routes.test.ts`: the route's status codes and the `Allow`
  header on a 405. `server/progress.integration.test.ts`: the delete against a
  real database, including a user whose rows must not be touched.
- `ProgressSyncQueue.stop` resolves only after an in-flight save settles and
  ignores work enqueued afterwards. `src/progress/core/utils/progress-api` and
  `use-lesson-progress`: `reset` waits for the queue before it calls the API,
  re-bootstraps to default progress, and a failed reset rethrows and still
  leaves a working queue.
- Component tests: `LessonPreferences` writes each preference and disables the
  motion toggle under reduced motion; `LessonProgressPanel` renders nothing when
  synced or pending and the retry when it errors; `LessonAudioToggle` reflects
  and flips `audioEnabled` and shows the blocked copy; `LessonRestart` opens,
  cancels without calling the API, confirms, and shows a failure.
- `e2e/account-profile.spec.ts`: the `Уроки` section switches both preferences
  and keeps them across a reload. A lesson spec (lesson 2) covers the restart:
  the sidebar button opens the modal, `Esc` and «Скасувати» leave progress alone,
  «Скинути прогрес» returns the lesson to step 1, and `/course` then shows
  lesson 3 locked. Both at 320 px and with the keyboard only.

## Slices

1. **Account settings.** The `Уроки` section, `usePrefersReducedMotion` in
   `src/hooks`, the bar deleted from the five lesson pages with its content copy,
   `LessonAudioToggle` on every sound step, and the progress panel trimmed to its
   failure states. *Accepts when* no lesson step shows a settings bar, both
   preferences are switchable on the account page and survive a reload, every
   step that plays sound can still turn sound on, and the audio messages still
   appear.
2. **Reset endpoint.** `idsFrom` on the catalog, `ProgressService.reset`, the
   route, the `Allow` header, and `createProgressApi.reset`, with the server and
   integration tests. *Accepts when* the route deletes the target lesson and the
   later ones for the caller only, returns the remaining items, and answers 401,
   404 and 405 correctly.
3. **Restart in the lesson.** The modal from the Untitled UI CLI,
   `LessonRestart`, `ProgressSyncQueue.stop`, `useLessonProgress.reset` and
   `reset` on `LessonProgressController`, the `LessonShell` prop, and the e2e.
   The five `src/progress/use-lesson-*-progress.ts` wrappers need no change —
   they return the controller unchanged — but the five
   `src/pages/lesson-*-page/hooks/use-lesson-*-page.ts` hooks pass `reset`
   through to their page. *Accepts when* a confirmed reset returns the lesson
   to step 1 and locks the later lessons, a cancelled one changes nothing, a
   failed one is reported inside the modal and leaves the lesson saving normally,
   and the modal traps focus, closes on `Esc`, and returns focus to the trigger.
