# Stage I · Lesson 1 — Step 04 `VirtualGuitarString` Implementation Review

## Review metadata

- Review date: 2026-09-10
- Review scope: implementation step 04 — `VirtualGuitarString`
- Current HEAD SHA: `85969cef2081449c51ae462d46b8fda354f0fc69`
- Specification: `docs/lesson-designs/stage-01-lesson-01-sound.md`
- Course-map sources: `docs/course-map/README.md`; `docs/course-map/stage-01-sound.md`
- Workflow state: `docs/workflow/stage-01-lesson-01.yaml`
- Previous review artifacts: `docs/reviews/stage-01-lesson-01/review-01-foundation.md`; `docs/reviews/stage-01-lesson-01/review-02-foundation-fixes.md`; `docs/reviews/stage-01-lesson-01/review-03-foundation-final.md`
- Artifact identifier: `stage-01-lesson-01 / implementation-review-04-step-04`

## Final verdict

**CHANGES REQUIRED**

The component supplies a usable visual string, button and pointer activation, pause/slow/static controls, prediction state, stop state, and local completion integration without introducing audio or later lesson work. However, the central prediction-to-experiment sequence currently reveals the correct prediction before the test and does not communicate the specified causal relationship between string motion and sound. The paused and stopped representations also contradict their visual or announced states. These defects block approval of the slice.

## Findings

### Critical

None.

### High

#### HIGH-01 — Saving the prediction reveals whether it is correct before the experiment

- File and location: `src/components/lesson/VirtualGuitarString.tsx:136–138`; `src/components/lesson/ChoiceQuestion.tsx:12–17`
- Issue: The prediction question is passed through the ordinary correctness feedback path with `correctChoiceId="fade"`. As soon as the learner selects “Подія швидко стихне” and activates “Зберегти прогноз”, `ChoiceQuestion` displays “Так.” before the learner plucks and stops the string. Other choices receive neutral hypothesis language, so the UI discloses which prediction the application considers correct before the controlled test.
- Why it matters: This turns the required `прогноз → експеримент → спостереження` discovery cycle into answer confirmation. It removes the pedagogical reason to perform the stop experiment and treats one hypothesis as an assessed answer before evidence is available.
- Specification/principle: Screen 2 says that testing matters more than guessing, answers are hypotheses rather than an exam, and match/mismatch feedback appears after the test. The implementation plan says to verify the causal scenario in the order prediction, stop, observation.
- Smallest recommended fix: Add a narrow neutral prediction mode to `ChoiceQuestion` (prediction is explicitly an approved mode of this primitive) so saving any choice only confirms that the prediction was recorded and invokes `onCheck`. Keep the comparison and match/mismatch message local to `VirtualGuitarString` and reveal it only after `stop()`.

#### HIGH-02 — The implemented stop experiment does not establish the required string-to-sound causal relationship

- File and location: `src/data/lessons/stage-01-lesson-01.ts:18–29`; `src/components/lesson/VirtualGuitarString.tsx:94, 118–119, 133, 137–138`
- Issue: The approved observation and prediction ask what the string does while the sound continues and what happens to the sound when the string is stopped. The implementation replaces “звук” with the vague “подія” in both questions and in the result. It provides no synchronized textual “sound continues / string moves” indicator. After stopping, it neither displays the selected choice under “Мій прогноз” and the observed result under “Побачив/ла” nor gives the specified explanation that motion is passed to the guitar and nearby air until the stopped string ceases creating new changes.
- Why it matters: A learner can complete and persist the entire slice having seen only that an undefined “event” faded. The slice therefore does not deliver its main learning result: using the stop experiment to connect continued string motion with continued sound and source stopping with sound quickly fading. This is especially consequential on the intentional no-audio path, where precise visual and textual modeling must replace hearing rather than remove sound from the claim.
- Specification/principle: Screens 1 and 2 require a visible duration/status substitute for audio, the sound-focused questions, side-by-side prediction and observation after the test, and the short causal explanation. The lesson outcome and implementation step 4 require the causal stop scenario to be verified without depending on audio.
- Smallest recommended fix: Restore the specified sound wording; add a synchronized, non-audio-dependent text/status indicator pairing moving string with continuing sound; and after `stop()` show the saved choice label as “Мій прогноз”, the observed rapid fade as “Побачив/ла”, and the approved short explanation about the guitar/nearby air and no new changes. Do not add audio or propagation animation.

### Medium

#### MEDIUM-07 — Paused and stopped states are represented inaccurately

- File and location: `src/components/lesson/VirtualGuitarString.tsx:36–42, 77–81, 108–119`
- Issue: The string path offset is derived from the last animation time regardless of `stringState`, so stopping commonly freezes the string in a visibly bent position instead of returning it to its resting line. In animated mode, a paused string is described by both the SVG description and live status as being at rest. In static/reduced-motion mode, the frame description takes precedence even after `stringState` becomes `stopped`, leaving the announced and visible stopped result unchanged.
- Why it matters: The learner is being asked to infer causality from the distinction between moving, paused, stopped, and at rest. A frozen displaced curve paired with either “at rest” or an old frame label is a physically and semantically contradictory result. Screen-reader and reduced-motion learners do not receive the required stopped-state change.
- Specification/principle: Screens 1 and 2 require synchronized state text and a post-stop change in text and shape, not only sound or animation. Accessibility information must accurately represent the same state as the visual model.
- Smallest recommended fix: Make `stopped` resolve to the centered/resting path (and the corresponding static frame), give `paused` its own accurate SVG/live text, and prioritize `stopped` over static-frame descriptions so every viewing mode exposes the stop result.

#### MEDIUM-08 — The disabled stop action gives no reason or next-step guidance

- File and location: `src/components/lesson/VirtualGuitarString.tsx:42, 123–130`
- Issue: “Зупинити струну” is disabled until a prediction has been saved and the test has been started, but the controls provide no explanation while it is disabled. A native disabled button cannot itself expose a tooltip through keyboard focus.
- Why it matters: The primary causal action can appear non-functional, particularly before the prediction or after the first demonstration has ended. Learners must infer which prerequisite is missing instead of receiving the specified one-step instruction.
- Specification/principle: The documented edge case explicitly requires a disabled stop button with an explanation such as “Спочатку смикни струну”. Physical experiments should present one safe, clear action at a time.
- Smallest recommended fix: Add nearby visible helper text, associated with the control where useful, that reflects the current prerequisite: first pluck, then save a prediction, then pluck to run the stop test. Keep the button natively disabled until movement is active.

### Low

None.

## What is good and should remain unchanged

- `VirtualGuitarString` remains the lesson-specific owner of simulation controls and transient interaction state; no speculative experiment abstraction was added.
- The implementation reuses the approved `ChoiceQuestion`, `LessonStep`, and `RealWorldExperiment` primitives rather than replacing them.
- `rest`, `playing`, `paused`, and `stopped` are explicit states, and request-animation-frame work is cancelled during effect cleanup.
- Repeated plucks restart one model instead of layering animations.
- Button activation provides a keyboard-accessible equivalent to the supplemental pointer interaction.
- All newly introduced controls use native buttons, visible focus treatment, and at least 44 px minimum height.
- The static frame path and system reduced-motion detection make the visual observation available without animation.
- The experiment remains fully usable without audio or a guitar; the real-world alternative and safety note remain present.
- Prediction and playback phase stay in component-local session state. Only the completed lesson step is sent to the existing page-local persistence model.
- Returning to the persisted string step resets the simulation to a stable initial state, as specified.
- No dependency, route change, storage framework, generic lesson renderer, or schema/migration layer was introduced.

## Scope compliance

The implementation is limited to the virtual-string slice and its lesson content/page integration. It does not implement audio playback or preference state, sound propagation, a wavefront/ear model, checkpoint, completion, frequency, pitch, harmonics, or timbre. The reduced-motion/static representation is a relevant accessibility path for the string interaction and does not introduce the deferred propagation lab.

The sentence stating that audio is unnecessary is explanatory copy, not step 5 audio behavior. No future concept is introduced by name.

## Accessibility assessment

The implementation has strong baseline mechanics: native controls, large touch targets, focus-visible styling, an accessible SVG name/description, a polite status region, button fallback for the pointer interaction, and a non-animated frame mode. Information does not rely on color alone.

Accessibility is not ready for approval because the paused/stopped descriptions conflict with the actual state and static mode does not announce the stop result (MEDIUM-07). The unavailable stop action also lacks accessible visible guidance (MEDIUM-08). HIGH-02 affects accessibility directly: no-audio learners receive no explicit text model connecting the visible motion to sound.

## Architecture assessment

- **Component boundary:** Appropriate. The simulation remains lesson-specific, while generic question behavior stays in `ChoiceQuestion`.
- **State ownership:** Appropriate overall. Playback phase, selected prediction, attempts, frame choice, speed, and motion preference are transient and are not persisted. Page-level completion is updated through one callback.
- **Abstraction level:** No premature framework or generic simulation layer is present. The neutral prediction behavior for HIGH-01 should be a small mode on the already approved question primitive, not a new `PredictionPrompt` abstraction.
- **Animation lifecycle:** The request-animation-frame path has cleanup and a stable pause/resume basis. The derived presentation needs the state corrections in MEDIUM-07 but does not require a state-machine rewrite.
- **Integration:** The existing `/lessons/01` route, lesson shell, navigation focus intent, storage fallback, and foundation behavior remain intact. Completion updates are idempotent through the existing `Set` conversion.
- **Maintainability:** Content choices remain in the lesson data module. The remaining educational result copy should also stay in lesson-specific content or local composition rather than moving sound facts into the generic primitive.

## Validation results

The following commands were actually executed during this review:

- `env PATH=/home/okirienko/.nvm/versions/node/v24.3.0/bin:/home/okirienko/.local/bin:/home/okirienko/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin node -v`: passed and reported `v24.3.0`, matching `.nvmrc` major version `24`.
- `env PATH=/home/okirienko/.nvm/versions/node/v24.3.0/bin:/home/okirienko/.local/bin:/home/okirienko/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin corepack pnpm build`: passed. TypeScript completed, Vite 7.3.6 transformed 1,235 modules, and the production bundle was generated.
- `env PATH=/home/okirienko/.nvm/versions/node/v24.3.0/bin:/home/okirienko/.local/bin:/home/okirienko/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin corepack pnpm lint`: passed (`tsc -b --pretty false`).
- `git diff --check`: passed with no reported whitespace errors in the tracked diff.

No test script is defined in `package.json`, so no automated test suite was run.

## Recommended next action

Route this slice to targeted fixes for `HIGH-01`, `HIGH-02`, `MEDIUM-07`, and `MEDIUM-08`, then perform a targeted re-review. Do not begin audio or any later lesson slice.

## Handoff notes

- Blocking finding IDs: `HIGH-01`, `HIGH-02`, `MEDIUM-07`, `MEDIUM-08`.
- Preserve the approved foundation behavior and the items listed under “What is good and should remain unchanged.”
- Fixes should be restricted to the four IDs above and should not add audio, propagation, checkpoint, completion, or future terminology.
- The next review must be a new immutable artifact; do not rewrite this review.

## Exact verdict

CHANGES REQUIRED
