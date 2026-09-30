# Stage I · Lesson 2 — Implementation Design

## Goal

Implement Lesson 2, «Чому звуки бувають високими й низькими?», in one PR (#20)
under the process in `AGENTS.md`. The pedagogy is the one already approved. The
lesson is built on the current server-synced progress platform and verified in
production after merge.

## Sources and authority

- **Pedagogy (binding, unchanged).** It is in
  `docs/lesson-designs/stage-01-lesson-02-frequency-pitch.md` and was approved
  by design review 02 on 2026-09-11 (commit `1de4e0d`; the review files remain
  in git history). The binding sections are:
  - «Навчальний результат», «Принцип взаємодії», «Мовна й фізична домовленість»;
  - «Загальна структура екрана»;
  - «Екран 0» to «Екран 7»;
  - «Критерії завершення», «Повторне використання й межі компонентів»,
    «Доступність і деградація», «Edge cases»;
  - the pedagogical items of «Definition of done».

  The screen numbering 0–7 is authoritative. The table in «Потік уроку»
  (steps 0–6) merges screens 4 and 5 and serves only as an overview.
- **Superseded by this design.** «Дані, які слід зберігати» (except the rules
  restated below), «Запропонована TypeScript-модель», «Запропонований план
  реалізації зрізами», and the validation line of «Definition of done».
  Wherever the spec names old slices, read them as:
  - `foundation` → slice 1;
  - `frequency-lab` and `optional-audio-counterexample` → slice 2;
  - `guitar-application`, `checkpoint`, and `lesson-completion-and-bridge` →
    slice 3.
- **Course map:** `docs/course-map/stage-01-sound.md`.
- **Progress platform:** `docs/technical-designs/multi-lesson-progress-foundation.md`.
  Lesson 2 adds one catalog entry and one client adapter, with no service,
  route, database, or reusable-hook change.
- The old v1 workflow `stage-01-lesson-02` was archived with the rest of the
  retired process in PR 21 (`docs/archive/workflow/`), so nothing is left to
  retire here.

Each step reads only the screen sections its slice implements.

## Non-goals

- Changing the approved pedagogy, the terminology boundaries, or the screen
  order.
- A generic lesson engine or audio framework, or turning `VirtualGuitarString`
  into a universal simulation.
- Changing the progress service, API routes, database schema, auth, or
  migrations.
- Changing Lesson 1's behavior or copy, or starting Lesson 3.
- New dependencies.

## Progress

### Step IDs and completion

The ID order below is also the server catalog's `stepIds`.

| Step ID | Screen | Stop | Completes when |
|---|---|---|---|
| `intro` | 0 | 1 Струна | the learner starts the lesson, having chosen the guitar or the virtual string |
| `string` | 1 | 1 Струна | the learner answers which state sounded higher, through either path (criterion 1) |
| `repeats` | 2 | 2 Повтори | a prediction is made **and** the synchronized comparison finishes, or the step view reaches its end (criterion 2) |
| `frequency` | 3 | 3 Частота | the reveal is fully opened **and** at least one lab value changed (criteria 3, 4) |
| `loudness` | 4 | 3 Частота | the counterexample is answered and its explanation shown (criterion 5) |
| `guitar` | 5 | 4 Гітара | the application question is answered, through either path (criterion 6) |
| `checkpoint` | 6 | 5 Перевірка | the spec's pass rule sets `checkpointPassed` (criterion 7) |
| `complete` | 7 | 5 Перевірка | the learner presses «Завершити урок», which sets `completedAt` (criterion 8) |

Both paths count equally. On screens 1 and 5 the guitar path completes the step
through the same answer as the virtual path. The app never needs to observe the
guitar. `complete` maps to stop 5, as in Lesson 1, because `LessonShell` never
shows stop 0.

### Client adapter

`src/progress/lesson-two.ts` mirrors `src/progress/lesson-one.ts`:

- **Identity:** lesson ID `stage-01-lesson-02`, `schemaVersion` 1,
  `contentVersion` 1.
- **Type:** `LessonTwoProgress = ProgressValue<LessonTwoStepId> & {
  audioEnabled: boolean; prefersStatic: boolean }`.
- **Storage keys:** the guest key is `guitar-mastering:stage-01-lesson-02`.
  The user and import-decision keys follow Lesson 1's pattern.
- **Preferences:** audio and step-by-step viewing are global, so they share
  Lesson 1's `guitar-mastering:lesson-preferences` record with the same shape.
  Sync sends only `currentStepId`, `completedStepIds`, `checkpointPassed`, and
  `completedAt`.
- **Normalization:**
  - drop unknown steps and follow the table order;
  - a completed step unlocks the next;
  - `complete` unlocks only when `checkpointPassed`;
  - a valid `completedAt` implies `checkpointPassed`, `checkpoint`, and
    `complete`, and is never lost;
  - corrupt or ahead-of-unlock state falls back to the highest unlocked step.
- **Checkpoint:** the UI sets `checkpointPassed` only through the checkpoint
  rules.
- **Hook:** `useLessonTwoProgress` wraps `useLessonProgress`.
- **Storage rules kept from the spec:** predictions, slider values, attempts,
  card order, and the real-guitar answer stay in component state. Audio,
  microphone data, and personal data are never stored.

### Server catalog

Add `"stage-01-lesson-02": { schemaVersion: 1, contentVersion: 1, stepIds: [<the eight IDs in table order>] }`
to `productionProgressCatalog`. A later rename of any ID needs a version bump
and handling for stored rows.

### Progress UI

Lesson 1 renders its progress UI inline (`LessonOnePage.tsx`):
- the storage-unavailable notice;
- the sync status with retry;
- the guest-import prompt;
- clearing the device cache.

Slice 1 extracts this markup unchanged into
`src/components/lesson/LessonProgressPanel.tsx`, which both pages use. Lesson 1's
copy and behavior stay the same, and its e2e specs must stay green.

## Page, content, and components

- **Route and content:** `/lessons/02` renders `src/pages/LessonTwoPage.tsx`.
  The content lives in `src/data/lessons/stage-01-lesson-02.ts`.
- **Reuse:** `LessonShell`, `LessonStep`, `ChoiceQuestion`,
  `RealWorldExperiment`, and `LessonProgressPanel`, plus Lesson 1's heading
  focus, audio opt-in, motion toggle, and reduced-motion handling.
- **New components** in `src/components/lesson/`, with their logic in pure
  helpers:
  - `SameStringPitchExperience` (screens 1 and 5);
  - `FrequencyComparison` (screen 2);
  - `FrequencyPitchLab` (screen 3, with discrete 220/330/440 Hz and the
    reveal);
  - `PitchLoudnessComparison` (screen 4);
  - `FrequencyPitchCheckpoint` (screen 6).
- **Audio** follows `VirtualGuitarString`: a lazily created context, and
  `resume()` on a user gesture.
  - There is no autoplay, and only one tone plays at a time.
  - Gain ramps on both attack and release, and never exceeds Lesson 1's peak.
  - A tone stops when the document becomes hidden, when the step changes, and
    on unmount.
  - Unavailable or blocked audio shows an inline status message, as in Lesson
    1, and the text path continues. Audio is never required.
  - Screen 2 plays the optional 220 Hz and 440 Hz tones separately, never
    overlapping, with equal duration and comparable perceived loudness.
  - Screen 4 shows the comfort reminder before any playback. Only this screen
    changes loudness, within a bounded range.
- **Home:** the `02` entry in `src/data/lessons.ts` still reads «Ноти, тон і
  півтон». It gets the Lesson 2 title and description, and stays `next` until
  slice 3. `LessonCard` links to `/lessons/${lesson.id}` instead of the
  hard-coded `/lessons/01`.

## Tests

- **Unit tests** (Vitest, `build/`, no new dependency) cover the pure helpers:
  - the adapter: parse, normalize, the completion invariants, preference
    stripping, and the shared preferences record;
  - repeat counting and timing;
  - discrete lab values and the reveal order;
  - the checkpoint pass rule.
- **Server tests** check that the catalog accepts Lesson 2 steps and rejects
  unknown ones, and that Lesson 1 is unchanged.
- **Browser tests** (Playwright, `e2e/`, with the mocked API as in
  `account-profile.spec.ts`) are added in the slice that introduces each
  behavior:
  - **slice 1:**
    - screens 0–1 through both paths;
    - resume after a reload;
    - guest import and sync for Lesson 2, where the PUT body has no
      preference keys;
    - the storage-unavailable notice;
    - Lesson 1 specs unchanged;
  - **slice 2:**
    - keyboard use and step mode;
    - reduced motion via `emulateMedia`;
    - no audio, and blocked audio via an `AudioContext` init-script stub for
      both an absent context and one whose `resume()` rejects;
  - **slice 3:**
    - the checkpoint by keyboard, including the counterexample;
    - completion, and restoring the completed state;
    - fallback from corrupted guest storage;
    - a full run at 320 px;
    - opening Lesson 2 from the home page while Lesson 1's card still opens
      Lesson 1.
- **Screen reader:** role and accessible-name assertions in the Playwright
  specs, plus one manual screen-reader pass that the slice 3 review reports.

## Slices

These are checkpoints inside PR #20. Each ends with a review comment, and the
owner approves the design now and the merge at the end.

1. **`lesson-foundation`:**
   - the adapter, hook, and catalog entry;
   - `LessonProgressPanel`;
   - the route, the content file, and screens 0–1;
   - the corrected home entry, still `next`;
   - the slice 1 tests.
2. **`frequency-lab-and-audio`:**
   - screens 2–4 with the reveal;
   - all optional audio and its safety rules;
   - the slice 2 tests.
3. **`guitar-checkpoint-completion`:**
   - screens 5–7;
   - the `LessonCard` link, with Lesson 2 `available`;
   - the slice 3 tests.

## Acceptance criteria

- The eight screens follow the binding spec. Terms appear only after the
  motivating observation, and there is no length, tension, density, notes,
  octave, intervals, harmonics, or timbre.
- Every «Критерії завершення» item is enforced through the step table. Audio,
  owning a guitar, and first-try correctness are never required.
- Progress for `stage-01-lesson-02` syncs through the existing API with the
  eight IDs. Guest progress, import, and cache clearing work, and Lesson 1 is
  unaffected.
- The lesson works at 320 px, keyboard-only, with a screen reader, in reduced
  motion, with no audio, and with blocked audio.

## Validation and delivery

- **Every slice:** `corepack pnpm test`, `corepack pnpm build`,
  `corepack pnpm test:browser`, and `git diff --check`. CI also runs the
  PostgreSQL integration tests.
- **After merge:**
  - `corepack pnpm evidence:delivery --sha <merged SHA>` and
    `corepack pnpm smoke:production <origin>`;
  - `GET /api/v1/progress/stage-01-lesson-02` without a session must return
    `401` with `error.code` `UNAUTHENTICATED`. Today it returns 404, so this
    proves the catalog entry is live;
  - the hashed JS bundle referenced by `/` must contain `stage-01-lesson-02`.
    The app uses `HashRouter`, and any path serves `index.html`, so this is
    what proves the client shipped.

## Risks

- **Step IDs** are stable from the first release. Renaming one needs a version
  bump.
- **Extracting `LessonProgressPanel`** touches Lesson 1. It is a byte-for-byte
  markup move, guarded by Lesson 1's existing e2e specs.
- **Audio comfort** relies on the ramps, the gain cap, one tone at a time, and
  no autoplay.

## Rollback

Revert the merge commit and let it redeploy. Lesson 2 rows saved in the
meantime stay in the database, return `404 UNKNOWN_LESSON` until the entry is
released again, and need no migration.
