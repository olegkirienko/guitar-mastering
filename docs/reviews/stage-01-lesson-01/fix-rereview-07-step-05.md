# Stage I · Lesson 1 — Step 05 Fix Re-Review

## Review metadata

- Review date: 2026-09-10
- Review scope: targeted re-review of `HIGH-03`, `MEDIUM-09`, `MEDIUM-10`, `MEDIUM-11`, and `MEDIUM-12`, plus regressions directly caused by their fixes
- Current HEAD SHA: `04251c3172ed7bb30b9a5c289a72a0facf37728e`
- Specification: `docs/lesson-designs/stage-01-lesson-01-sound.md`
- Original review: `docs/reviews/stage-01-lesson-01/implementation-review-06-step-05.md`
- Approved prior-slice baseline: `docs/reviews/stage-01-lesson-01/fix-rereview-05-step-04.md`
- Artifact identifier: `stage-01-lesson-01 / fix-rereview-07-step-05`

## Final verdict

**CHANGES REQUIRED**

The activation, persisted-preference, naturalistic pluck, and tab-visibility fixes resolve four of the five selected findings. The static/reduced-motion path can now produce audio, but it restarts the pluck on every successive frame, so `MEDIUM-11` remains only partially fixed. Step 05 is not approved and must return to one more targeted fix cycle limited to `MEDIUM-11`.

## Finding verification

### HIGH-03

Status: **FIXED**

- `getAudioContext()` now reuses a context only when a context actually exists and is not closed; otherwise it reaches guarded `AudioContext` construction (`src/components/lesson/VirtualGuitarString.tsx:139–151`).
- Unsupported or failed construction selects the inline `unavailable` fallback, while a rejected `resume()` selects `blocked`, disables the durable preference, and leaves the visual lesson usable (`src/components/lesson/VirtualGuitarString.tsx:141–164`, `311–323`).
- The initial enable and retry paths can now reach context creation/resume instead of returning `undefined` before construction.

### MEDIUM-09

Status: **FIXED**

- `audioEnabled` is part of `LessonOneProgress`, defaults off, is validated when restored, and is saved through the existing local-storage effect (`src/pages/LessonOnePage.tsx:9–12`, `14–29`, `39`).
- The introduction now exposes an opt-in native toggle, and the same page-owned preference is passed into the string component with a change callback (`src/pages/LessonOnePage.tsx:46–55`).
- Only the boolean preference is persisted; `AudioContext`, sources, gains, and playback state remain local to `VirtualGuitarString`.

### MEDIUM-10

Status: **FIXED**

- The bare triangle oscillator identified by the original review has been replaced by a short deterministic plucked-string buffer: a noise excitation passes through a 110 Hz feedback delay with damping and an additional decay envelope (`src/components/lesson/VirtualGuitarString.tsx:167–190`, `201–220`).
- This supplies a naturalistic string attack and decay instead of the former steady electronic oscillator tone, while retaining the existing smooth gain ramp, short duration, and dependency-free implementation.

### MEDIUM-11

Status: **PARTIALLY FIXED**

- The user-operated static-frame action now calls `startAudio()`, so reduced-motion and manual-static users are no longer left with an enabled state that has no playback path (`src/components/lesson/VirtualGuitarString.tsx:269–275`, `326–328`).
- However, `nextFrame()` invokes `startAudio()` on every press. Advancing through the four frames therefore restarts a new pluck for every frame rather than playing one short sound at the start or deliberate repeat of the experiment. This conflicts with the original finding's required synchronization and its explicit direction not to introduce automatic frame-to-frame audio.
- Smallest remaining fix: trigger audio only when a new static experiment/pluck begins, or provide a narrowly labeled manual replay action. Advancing later frames of the same observation must not retrigger the attack.

### MEDIUM-12

Status: **FIXED**

- A component-local `visibilitychange` listener now moves active animation to `paused` when the document becomes hidden and always fades/stops active audio (`src/components/lesson/VirtualGuitarString.tsx:96–105`).
- Nothing resumes on visibility restoration; the learner must use the existing continue/pluck/frame action, preserving the required user gesture and preventing surprise background continuation.

## Regressions introduced by the fixes

None outside the unresolved synchronization behavior already retained under `MEDIUM-11`.

The no-audio path, prediction/observation sequence, stopped result, and step-04 accessibility behavior remain present. No propagation model, checkpoint, completion flow, future terminology, dependency, microphone access, or recording behavior was introduced.

## Validation results

The following commands were actually executed under the Node version selected by `.nvmrc`:

- `env PATH=/home/okirienko/.nvm/versions/node/v24.3.0/bin:... node -v`: passed and reported `v24.3.0`, matching `.nvmrc` major version `24`.
- `env PATH=/home/okirienko/.nvm/versions/node/v24.3.0/bin:... corepack pnpm lint`: passed (`tsc -b --pretty false`).
- `env PATH=/home/okirienko/.nvm/versions/node/v24.3.0/bin:... corepack pnpm build`: passed. Vite 7.3.6 transformed 1,235 modules and generated the production bundle.
- `git diff --check`: passed with no whitespace errors.

No `test` script is defined in `package.json`, so no automated test suite was run. The project has no browser-level audio test harness; audio lifecycle and static-mode synchronization were therefore verified by direct control-flow inspection in addition to TypeScript/build validation.

## Slice status

Implementation step 05 is not approved. Another targeted fix cycle is required for `MEDIUM-11` only.

## Recommended next action

Route step 05 to targeted fixes for `MEDIUM-11`, then create a new immutable targeted re-review. Do not begin step 06.

## Exact verdict

CHANGES REQUIRED
