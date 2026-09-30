# Stage I · Lesson 2 — v3.1 Delivery Design

## Goal

Deliver Lesson 2, «Чому звуки бувають високими й низькими?», under the v3.1
workflow. The pedagogy is the one already approved. The lesson is rebuilt on
the current server-synced progress platform, shipped as one PR, and verified in
production.

## Sources and authority

- **Pedagogy (authoritative, unchanged).** It is in
  `docs/lesson-designs/stage-01-lesson-02-frequency-pitch.md` and was approved
  in `docs/reviews/stage-01-lesson-02/design-review-02.md` on 2026-09-11. The
  binding sections are:
  - «Навчальний результат», «Принцип взаємодії», «Мовна й фізична домовленість»;
  - «Загальна структура екрана», «Потік уроку»;
  - «Екран 0» to «Екран 7»;
  - «Критерії завершення», «Повторне використання й межі компонентів»,
    «Доступність і деградація», «Edge cases»;
  - the pedagogical items of «Definition of done».
- **Superseded by this design.** In that file: «Дані, які слід зберігати»,
  «Запропонована TypeScript-модель», «Запропонований план реалізації зрізами»,
  and the validation line of «Definition of done». Also the v1 workflow
  `docs/workflow/stage-01-lesson-02.yaml`.
- **Course map:** `docs/course-map/stage-01-sound.md`.
- **Progress platform:** `docs/technical-designs/multi-lesson-progress-foundation.md`.
  Lesson 2 adds one catalog entry and one client adapter, and no service,
  route, database, or reusable-hook change.

Each phase reads only the screen sections its slice implements.

## Owner decisions (2026-09-30)

- The v1 workflow `stage-01-lesson-02` was never started, and it cannot be
  resumed under v3.1:
  - it has no Git lifecycle;
  - the contract migrates an active v1 workflow only to v3;
  - v3.1 initialization rejects any same-ID history, so the ID cannot be
    reused.

  It is retired. Slice 1 deletes the file and keeps its reviews and the
  pedagogical spec as history.
- The work item ID is `stage-01-lesson-02-frequency-pitch`. The lesson content
  and progress identity stay `stage-01-lesson-02`.

## Non-goals

- Changing the approved pedagogy, the terminology boundaries, or the screen
  order.
- A generic lesson engine or audio framework, or turning `VirtualGuitarString`
  into a universal simulation.
- Changing the progress service algorithm, routes, database schema, auth, or
  migrations.
- Changing Lesson 1 behavior or storage, or starting Lesson 3 content.
- New dependencies.

## Progress design

### Step IDs

Each screen has one stable ID. The same IDs, in this order, form the server
catalog's `stepIds`.

| Step ID | Screen | Progress stop |
|---|---|---|
| `intro` | 0 | Струна |
| `string` | 1 | Струна |
| `repeats` | 2 | Повтори |
| `frequency` | 3 | Частота |
| `loudness` | 4 | Частота |
| `guitar` | 5 | Гітара |
| `checkpoint` | 6 | Перевірка |
| `complete` | 7 | — |

The five visible progress stops are a UI grouping of these IDs.

### Client adapter

`src/progress/lesson-two.ts` mirrors `src/progress/lesson-one.ts`:

- **Identity:** lesson ID `stage-01-lesson-02`, `schemaVersion` 1,
  `contentVersion` 1.
- **Type:** `LessonTwoProgress = ProgressValue<LessonTwoStepId> & {
  audioEnabled: boolean; prefersStatic: boolean }`. The default is `intro`, no
  completed steps, audio off, not static, not passed, and
  `completedAt: null`.
- **Storage keys:** the guest key is `guitar-mastering:stage-01-lesson-02`.
  The user key and import-decision key follow Lesson 1's pattern.
- **Preferences:** audio and step-by-step viewing are global, as the spec
  requires, so they share Lesson 1's `guitar-mastering:lesson-preferences`
  record with the same shape.
- **Sync:** only `currentStepId`, `completedStepIds`, `checkpointPassed`, and
  `completedAt` are sent, because the server rejects any other key.
- **Parse and normalize:**
  - unknown steps are dropped, and the order follows the table;
  - unlocking is linear: a completed step unlocks the next, and
    `checkpointPassed` or a valid `completedAt` unlocks `complete`;
  - a valid `completedAt` implies `checkpoint` and `complete` and is never
    lost;
  - corrupt or ahead-of-unlock state falls back to the highest unlocked step;
  - only the checkpoint rules set `checkpointPassed`.
- **Hook:** `useLessonTwoProgress` wraps `useLessonProgress` with this adapter,
  and the page also gets guest import, merge, and conflict handling for free.
- **Session state:** predictions, slider values, attempts, card order, and the
  real-guitar answer stay local to components, as the spec requires.

### Server catalog

Add `"stage-01-lesson-02": { schemaVersion: 1, contentVersion: 1, stepIds: [<the eight IDs in table order>] }`
to `productionProgressCatalog` in `server/progress-catalog.ts`. Lesson 1's
entry does not change.

Changing a step ID later requires a version bump and handling of stored rows.
That is why the IDs are fixed here.

## Page, content, and components

- **Route and content:** the route `/lessons/02` renders
  `src/pages/LessonTwoPage.tsx`. Its content (copy, choices, feedback, frames,
  and checkpoint cards) lives in `src/data/lessons/stage-01-lesson-02.ts`.
- **Reuse:** `LessonShell`, `LessonStep`, `ChoiceQuestion`, and
  `RealWorldExperiment`, plus Lesson 1's heading focus after a step change,
  the audio opt-in, and the reduced-motion handling.
- **New lesson-specific components** in `src/components/lesson/`, each
  responsible for the screens the spec assigns to it:
  - `SameStringPitchExperience` (screens 1 and 5);
  - `FrequencyComparison` (screen 2: 4 versus 8 repeats with a shared timer,
    counters, a static table, and a step mode);
  - `FrequencyPitchLab` (screen 3: discrete 220/330/440 Hz, buttons, a
    visible output, and the reveal);
  - `PitchLoudnessComparison` (screen 4);
  - `FrequencyPitchCheckpoint` (screen 6).
- **Audio** follows the user-gesture pattern in `VirtualGuitarString`, with a
  lazily created context and a short gain ramp:
  - it never autoplays, and only one tone sounds at a time;
  - "louder" never exceeds Lesson 1's peak gain;
  - blocked or unavailable audio falls back silently to the text path;
  - audio is never required for completion.
- **Home:** the `02` entry in `src/data/lessons.ts` currently reads «Ноти, тон
  і півтон». It gets the Lesson 2 title and description. It stays `next` until
  the final slice, which makes it `available` and links it.

## Implementation slices

Each slice ends with an implementation review. Between slices there is a
`next_slice_approval` gate, and the final slice routes to `merge_approval`.
The whole lesson merges once, so production never shows a partial lesson.

### 1. `lesson-foundation`

- Retire the v1 workflow:
  - delete `docs/workflow/stage-01-lesson-02.yaml`;
  - move the validator's repository pins from that file to this work item's
    workflow;
  - keep `docs/reviews/stage-01-lesson-02/` and the pedagogical spec.
- Progress:
  - the client adapter, the hook, and the server catalog entry;
  - unit tests for the adapter: parse, normalize, completion invariants,
    stripping the preferences before sync, and the shared preferences
    record;
  - server tests: the catalog accepts Lesson 2 steps and rejects unknown ones,
    and Lesson 1 behaves as before.
- The route, the content file, and the page with screens 0 and 1. Screen 1
  uses `SameStringPitchExperience` without audio.
- The corrected home entry, still `next`.

### 2. `frequency-lab-and-audio`

- Screens 2–4: `FrequencyComparison`, `FrequencyPitchLab` with the concept
  reveal, and `PitchLoudnessComparison`.
- Optional Web Audio for `SameStringPitchExperience`, the lab, and the loudness
  comparison, with the safety rules above.
- Component tests: counts and timing, discrete values, reveal ordering,
  keyboard and step mode, and the no-audio path.

### 3. `guitar-checkpoint-completion`

- Screen 5: the guitar application with its virtual alternative and safety
  copy.
- Screen 6: `FrequencyPitchCheckpoint`, with keyboard-accessible chain
  ordering, hints, the counterexample, and the `checkpointPassed` rule.
- Screen 7: explicit completion that sets `completedAt`, and the bridge
  question.
- The home entry becomes `available` and links to `/lessons/02`.
- A Playwright spec covering:
  - the full lesson at 320 px, keyboard-only and with no audio;
  - resuming after a reload;
  - the completed state restored;
  - fallback from corrupted guest storage.

## Acceptance criteria

- All eight screens follow the approved spec. Terms appear only after the
  observation that motivates them, and the spec's forbidden concepts (length,
  tension, density, notes, octave, intervals, harmonics, timbre) do not appear.
- Every completion criterion in «Критерії завершення» is enforced. Audio, owning
  a guitar, and first-try correctness are not required.
- Progress for `stage-01-lesson-02` syncs through the existing API with the
  eight catalog step IDs. Guests keep local progress, import works, and Lesson
  1 is unaffected.
- The lesson works at 320 px, keyboard-only, with a screen reader, in reduced
  motion, with no audio and with blocked audio.
- The v1 workflow is retired, and the repository validator passes.

## Validation

- **Every slice:** `corepack pnpm validate:workflow`, `test`, `build`, and
  `git diff --check`.
- **Slice 3 also:** `corepack pnpm test:browser`.
- **CI:** runs all of these, plus PostgreSQL integration.
- **Delivery verification:**
  - `corepack pnpm evidence:delivery --sha <merged SHA>`;
  - `corepack pnpm smoke:production <origin>`;
  - one read-only check that `GET /api/v1/progress/stage-01-lesson-02` without
    a session returns `401`, not `404 UNKNOWN_LESSON`, which proves the
    catalog entry is live;
  - `/lessons/02` serves the SPA shell.

## Risks

- **Stable step IDs.** A later rename needs a version bump and handling of
  stored rows. The IDs are fixed above for that reason.
- **Shared preferences.** Both lessons must parse the same record. The adapter
  tests cover reading and writing it from either lesson.
- **Audio comfort.** Gain is capped and ramped, only one tone plays at a time,
  and nothing autoplays.
- **Cost.** The pedagogical spec is 44.6 KB, so each phase reads only its
  screens.

## Rollback

Revert the merge commit and let it redeploy. Lesson 2 progress rows saved in
the meantime stay in the database. They return `404 UNKNOWN_LESSON` until the
entry is released again, and need no migration. Lesson 1 is unaffected.
