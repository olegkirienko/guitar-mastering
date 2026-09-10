# Stage I · Lesson 1 — Step 05 Implementation Review

## Review metadata

- Review date: 2026-09-10
- Review scope: implementation step 05 (`OptionalAudio`) plus direct regressions against the approved step-04 baseline
- Current HEAD SHA: `04251c3f3772ed7bb30b9a5c289a72a0facf37728e`
- Specification: `docs/lesson-designs/stage-01-lesson-01-sound.md`
- Course map: `docs/course-map/stage-01-sound.md`
- Approved baseline: `docs/reviews/stage-01-lesson-01/fix-rereview-05-step-04.md`
- Previous implementation review: `docs/reviews/stage-01-lesson-01/implementation-review-04-step-04.md`
- Artifact identifier: `stage-01-lesson-01 / implementation-review-06-step-05`

## Final verdict

**CHANGES REQUIRED**

The slice adds a compact opt-in audio control, avoids autoplay, keeps the visual/text path sufficient, and attempts smooth start/stop envelopes without adding a dependency. However, its first-enable guard always returns `undefined`, so no `AudioContext` is ever created and the slice's central capability cannot work. The remaining implementation also does not persist or expose the preference at the specified introduction, substitutes a bare triangle oscillator for the specified natural guitar sound, makes enabled audio unavailable in static/reduced-motion mode, and does not pause audio on tab focus loss. These are blocking specification and integration defects.

## Findings

### High

#### HIGH-03 — The enable action can never create the first audio context

- File and location: `src/components/lesson/VirtualGuitarString.tsx:128–150`
- Issue: `getAudioContext()` begins with `if (audioContext.current?.state !== 'closed') return audioContext.current`. Before any context exists, optional chaining produces `undefined`; `undefined !== 'closed'` is true, so the function returns `undefined` before reaching `new window.AudioContext()`. `enableAudio()` then exits without updating `audioEnabled` or `audioStatus`. The button therefore appears to do nothing and every later playback call remains disabled. In addition, context construction is outside the `try` in `enableAudio()`, so a synchronous construction failure would reject the click handler without selecting the specified blocked/unavailable fallback.
- Why it matters: Optional audio is the entire purpose of step 05, yet it is unreachable in every browser. The silent idle-state failure also gives the learner neither sound nor the required inline degradation message.
- Specification/principle: Implementation step 05 requires opt-in audio after a user gesture and correct degradation when audio is blocked; the blocked-browser edge case requires an inline message and manual retry while the lesson continues.
- Smallest recommended fix: Reuse a context only when it actually exists and is not closed, otherwise create it inside the guarded error path. Map unsupported construction to `unavailable` and creation/resume rejection to `blocked`, keeping the current visual path active and retry button available. Verify the first-enable, retry, and subsequent-pluck paths in a real browser.

### Medium

#### MEDIUM-09 — The audio preference is neither available at the introduction nor persisted

- File and location: `src/components/lesson/VirtualGuitarString.tsx:33–35, 276–288`; `src/pages/LessonOnePage.tsx:6–38, 43–46`
- Issue: Audio preference state is owned only by `VirtualGuitarString`. The introduction has explanatory text but no audio toggle, and `LessonOneProgress` still stores only the active and completed steps. Navigating back to the introduction unmounts the component and resets the preference; reloading does the same.
- Why it matters: A learner cannot make the specified up-front choice and the application forgets an explicit accessibility/media preference during ordinary lesson navigation. This contradicts the existing persistence contract rather than merely omitting a convenience.
- Specification/principle: Screen 0 requires a subtle audio toggle that can be changed at any time, and the MVP persistence list explicitly includes audio settings. The earlier foundation review deferred the real audio preference to implementation step 05.
- Smallest recommended fix: Add one validated `audioEnabled` preference to the existing page-local progress object, expose the same preference control at the introduction, and pass the preference/change callback into the string component. Do not persist an `AudioContext`, playback phase, or oscillator state; a restored opt-in should create/resume audio only on a later user gesture.

#### MEDIUM-10 — The generated tone is not the specified natural guitar sound

- File and location: `src/components/lesson/VirtualGuitarString.tsx:161–181`
- Issue: Playback is a single 110 Hz triangle oscillator with a gain envelope. That produces a synthetic electronic tone, not the short natural guitar sound specified for the plucked virtual string.
- Why it matters: The optional sensory example is meant to reinforce that the illustrated event is a plucked guitar string. A bare oscillator supplies a materially different timbre and weakens that concrete experience, even though it is correctly not used as an answer source.
- Specification/principle: Screen 1 explicitly calls for a short natural guitar sound when audio is enabled.
- Smallest recommended fix: Play a small, locally bundled and appropriately licensed bass-guitar pluck sample through the existing gain/fade path. Keep it short, preload-safe, opt-in, and dependency-free; retain the no-audio text/visual equivalent.

#### MEDIUM-11 — Enabled audio has no playback path in static or reduced-motion mode

- File and location: `src/components/lesson/VirtualGuitarString.tsx:44–45, 201–208, 235–240, 276–295`
- Issue: `startAudio()` is called from `pluck()`, playback resume, and speed changes, but `pluck()` explicitly skips it when `staticMode` is true. Static/reduced-motion users receive only `nextFrame()`, which never starts audio. The audio control remains visible and can report “Звук увімкнено,” while no available action can produce that sound.
- Why it matters: Reduced motion and audio are independent preferences. A learner who avoids animation but can hear should not receive a nonfunctional enabled state, and the UI must not promise playback that its available controls cannot trigger.
- Specification/principle: The design treats no-audio and reduced-motion as separate equivalent paths; audio must start only after a gesture, not only after an animated gesture.
- Smallest recommended fix: Let the user-initiated static-frame experiment trigger one short pluck sound at the appropriate start/repeat point, or provide a narrowly labeled manual “Відтворити звук” action. Do not introduce automatic frame-to-frame audio or continuous motion.

#### MEDIUM-12 — Audio continues after the lesson tab loses focus

- File and location: `src/components/lesson/VirtualGuitarString.tsx:82–111, 152–185`
- Issue: The component listens for reduced-motion changes and unmount cleanup but has no `visibilitychange` handling. A running oscillator remains scheduled when the tab becomes hidden, and the animation state is not deliberately paused. Returning to the tab can therefore expose continued or unexpectedly advanced media state.
- Why it matters: Unexpected background sound is disruptive, particularly for assistive-technology users and learners switching tabs. It also breaks synchronization between the sound and the observation the learner is meant to follow.
- Specification/principle: The explicit focus-loss edge case requires both animation and audio to pause and forbids surprise continuation when focus returns.
- Smallest recommended fix: Add one component-local visibility listener that, when the document becomes hidden, transitions active playback to the existing paused state and fades/stops the active audio. Do not auto-resume on return; let the current Continue/pluck action remain the user gesture that resumes it.

### Low

None.

## What is good and should remain unchanged

- Audio remains opt-in and no sound is started on mount.
- The visual model, live status, prediction, stop observation, and lesson completion callback do not depend on audio.
- The new control is a native button with a 44 px minimum target, visible focus treatment, textual state, and an `aria-pressed` value.
- The gain automation is aimed at avoiding clicks on start and stop, and stop/pause/repluck paths share the same local cleanup behavior.
- Active Web Audio nodes and the context are component-local rather than persisted.
- No microphone permission, recording, analytics, new dependency, propagation model, future terminology, checkpoint, or completion flow was added.
- The approved step-04 prediction and stopped-result behavior remains present.

## Correctness and integration assessment

The TypeScript/build integration succeeds, but HIGH-03 prevents the feature from operating at runtime. Once that is corrected, the audio control and string controls have a reasonable local relationship: pluck/repluck attempts to restart one sound, pause and stop fade it, and playback does not determine whether an answer is correct. Static-mode integration and document-visibility integration remain incomplete under MEDIUM-11 and MEDIUM-12.

## Pedagogy and specification compliance

The no-audio lesson remains pedagogically complete and retains the approved experience-before-explanation sequence. Audio is not used to grade observation or prediction, which is correct. The slice does not yet provide the specified concrete natural guitar example (MEDIUM-10), and its runtime failure means the optional multisensory experience cannot currently occur at all (HIGH-03).

## Accessibility assessment

The control has solid baseline semantics, readable status text, keyboard activation, and no autoplay. The visual/text model continues to convey all required learning outcomes when sound is off or unavailable. Accessibility is not ready for approval because reduced-motion users can opt into a state that cannot play (MEDIUM-11), and background audio is not stopped on focus loss (MEDIUM-12). The blocked fallback is also unreachable for the initial failure in HIGH-03.

## Persistence and state assessment

Transient Web Audio nodes, playback position, and status correctly remain component-local. The user preference itself is also component-local, however, so it is lost on navigation/remount and absent from the existing local-storage progress shape (MEDIUM-09). The smallest architecture is to lift only the boolean preference into the existing lesson progress owner while leaving all live media resources in `VirtualGuitarString`.

## Architecture and maintainability assessment

Keeping audio mechanics alongside the lesson-specific string simulation is appropriate for the first implementation; no generic media framework is warranted. The small `AudioStatus` union and node refs are understandable. Fixes should preserve this boundary: page-level state owns only the durable preference, while the component owns context/node lifecycle and educational synchronization. A local sample asset does not require a dependency or general-purpose audio service.

## Scope compliance

The application-code diff is limited to `VirtualGuitarString` and step-05 audio behavior. It does not implement step 06 propagation or any later lesson slice. The tracked workflow-template deletion and untracked launcher template are outside the application slice and were not assessed as step-05 implementation changes; this review does not modify or revert them.

## Validation results

The following commands were actually executed during this review:

- `env PATH=/home/okirienko/.nvm/versions/node/v24.3.0/bin:/home/okirienko/.local/bin:/home/okirienko/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin node -v`: passed and reported `v24.3.0`, matching `.nvmrc` major version `24`.
- `env PATH=/home/okirienko/.nvm/versions/node/v24.3.0/bin:/home/okirienko/.local/bin:/home/okirienko/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin corepack pnpm lint`: passed (`tsc -b --pretty false`).
- `env PATH=/home/okirienko/.nvm/versions/node/v24.3.0/bin:/home/okirienko/.local/bin:/home/okirienko/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin corepack pnpm build`: passed. Vite 7.3.6 transformed 1,235 modules and generated the production bundle.
- `git diff --check`: passed with no whitespace errors.

No `test` script is defined in `package.json`, so no automated test suite was run. The project has no browser-level audio test harness; the runtime failure in HIGH-03 was established by direct control-flow inspection and must be manually verified in a real browser after correction.

## Recommended next action

Route step 05 to targeted fixes for `HIGH-03`, `MEDIUM-09`, `MEDIUM-10`, `MEDIUM-11`, and `MEDIUM-12`, then perform a new targeted re-review. Do not begin step 06.

## Handoff notes

- Active blocking finding IDs: `HIGH-03`, `MEDIUM-09`, `MEDIUM-10`, `MEDIUM-11`, `MEDIUM-12`.
- Preserve the approved no-audio path and all step-04 behavior listed above.
- Keep fixes limited to audio activation/degradation, the durable preference/introduction control, guitar-like playback, static-mode playback, and focus-loss pause behavior.
- The next review must be a new immutable artifact; do not rewrite this one.

## Exact verdict

CHANGES REQUIRED
