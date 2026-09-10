# Stage I · Lesson 1 — Foundation Implementation Review

## Review metadata

- Review date: 2026-09-10
- Review scope: implementation steps 1–3
- Current git commit / HEAD SHA: `6296c4c57ce16c063aeffd100b0269c80184ef4a`
- Specification reviewed against: `docs/lesson-designs/stage-01-lesson-01-sound.md`
- Review artifact identifier: `stage-01-lesson-01 / review-01-foundation`

## Final verdict

**CHANGES REQUIRED**

The implementation is well-scoped and pedagogically aligned, with no critical or high-severity defects. However, six medium-severity issues should be corrected before implementing step 4 so that the reusable primitives, persistence behavior, and accessibility foundation do not have to be worked around in the next slice.

## Findings

### Critical

None.

### High

None.

### Medium

#### MEDIUM-01 — `ChoiceQuestion` cannot communicate its result to lesson-specific behavior

- File and location: `src/components/lesson/ChoiceQuestion.tsx:7–17`
- What is wrong: The selected and checked states are entirely internal, and the component exposes no callback to the containing lesson.
- Why it matters: The next slice cannot cleanly record the learner’s prediction in session state, display “Мій прогноз” after the experiment, or reveal/enable a subsequent lesson action after feedback. The likely workaround would duplicate choice state or require rewriting the primitive.
- Affected requirement or principle: Minimal reusable API, appropriate state ownership, and suitability as a foundation for the next implementation slice.
- Smallest recommended fix: Add one callback such as `onCheck(choiceId, isCorrect)`. Keep selection state local and do not persist it.

#### MEDIUM-02 — Reusable primitives generate duplicate document IDs

- Files and locations: `src/components/lesson/LessonStep.tsx:8–9`; `src/components/lesson/RealWorldExperiment.tsx:5`
- What is wrong: Every `LessonStep` uses `lesson-step-title`, and every `RealWorldExperiment` uses `experiment-title`.
- Why it matters: The current page renders only one of each, but the approved composition allows completed sections and repeated real-world experiments to remain visible. Once multiple instances render together, their `aria-labelledby` references become ambiguous.
- Affected requirement or principle: Accessibility, valid reusable component boundaries, and next-slice maintainability.
- Smallest recommended fix: Generate component-local IDs with `useId()`.

#### MEDIUM-03 — The storage fallback silently makes a false claim

- File and locations: `src/pages/LessonOnePage.tsx:30`; `src/pages/LessonOnePage.tsx:34–35`
- What is wrong: Read and write failures are caught, but the page always states that progress is saved on the device.
- Why it matters: The statement remains visible when storage is unavailable, blocked, or over quota. The learner is not told that progress will last only for the current session.
- Affected requirement or principle: Required localStorage-unavailable behavior and truthful persistence UI.
- Smallest recommended fix: Track a local `storageAvailable` boolean, set it to `false` on read/write failure, and conditionally render the session-only message.

#### MEDIUM-04 — Audio preference is a visible no-op and belongs to step 5

- File and locations: `src/pages/LessonOnePage.tsx:1`; `src/pages/LessonOnePage.tsx:8–10`; `src/pages/LessonOnePage.tsx:22`; `src/pages/LessonOnePage.tsx:34–38`
- What is wrong: The implementation displays and persists an audio toggle even though this slice contains no audio behavior. Changing it has no observable effect.
- Why it matters: It introduces unnecessary persisted state, presents a non-functional control, and pulls forward behavior assigned to implementation step 5.
- Affected requirement or principle: Scope discipline, minimal persisted state, and clear UI behavior.
- Smallest recommended fix: Remove `audioEnabled`, the audio icons, and the toggle for now. Add them with actual audio support in step 5.

#### MEDIUM-05 — Several new controls miss the specified 44 px touch target

- Files and locations: `src/components/lesson/LessonShell.tsx:19`; `src/pages/LessonOnePage.tsx:42`; `src/pages/LessonOnePage.tsx:49`; `src/components/lesson/ChoiceQuestion.tsx:16`
- What is wrong: The text-only navigation controls are approximately one text line high, while primary buttons using `py-2.5` are approximately 40 px high. The audio control is smaller still, though MEDIUM-04 recommends removing it.
- Why it matters: The approved mobile specification requires touch targets of at least 44×44 px. Small targets reduce usability on the supported 320 px mobile layout.
- Affected requirement or principle: Mobile usability and touch accessibility.
- Smallest recommended fix: Add `min-h-11` and appropriate inline padding to the affected actions. The padded radio labels already provide adequate targets and should remain unchanged.

#### MEDIUM-06 — Returning to the introduction loses focus

- File and locations: `src/pages/LessonOnePage.tsx:40`; `src/pages/LessonOnePage.tsx:49`
- What is wrong: Moving forward focuses the string-step heading through `shouldFocus`, but moving back renders the introduction without focusing its heading. The activated back button is unmounted.
- Why it matters: Keyboard and screen-reader users lose a reliable position after reverse lesson-step navigation.
- Affected requirement or principle: The specification requires focus to move to the new `h2` after lesson-step navigation.
- Smallest recommended fix: Focus the introduction heading on internal back navigation while avoiding unsolicited focus on the first page load.

### Low

None.

## What is good and should remain unchanged

- Lesson content is isolated in `src/data/lessons/stage-01-lesson-01.ts`, while sequence and behavior remain lesson-specific.
- `LessonShell` has a small responsibility: heading, return navigation, metadata, and compact progress.
- `LessonStep` has only the currently justified layout and focus props.
- `RealWorldExperiment` contains exactly the demonstrated guitar/no-guitar/safety pattern.
- Persistence remains local to the lesson page, with no schema version, migrations, storage service, or persisted interaction details.
- Stored JSON is parsed defensively, malformed values fall back safely, and unsupported step IDs are filtered.
- The introduction precedes definitions and presents a question rather than an answer.
- No frequency, Hz/Гц, pitch, harmonics, or timbre content appears in the implemented Lesson 1 material.
- The incomplete virtual-string area is honestly presented as a development placeholder.
- The `/lessons/01` route remains unchanged.
- The first lesson card matches the approved title and scope.
- No dependencies or unrelated abstractions were added.
- No additional optional improvements were recommended for this slice. A storage framework, lesson schema, reducer, generic renderer, or more configurable primitive APIs should not be introduced as part of these fixes.

## Scope compliance

The implementation mostly stayed within implementation steps 1–3.

The only detected scope creep is the audio preference UI and persisted `audioEnabled` state in MEDIUM-04. Audio behavior belongs with step 5 and is not currently needed.

Nothing else from step 4 or later was implemented prematurely. In particular, the slice did not introduce:

- a virtual-string implementation;
- audio generation or playback;
- propagation simulation;
- checkpoint or completion flow;
- a universal lesson schema or renderer;
- migrations, analytics, or speculative exercise abstractions.

## Accessibility assessment

The baseline is sound:

- Native buttons and radio inputs are used.
- `ChoiceQuestion` uses a native `fieldset` and `legend`.
- Visible focus styling is present.
- Feedback uses a live status and is associated with the question group through `aria-describedby`.
- Heading order follows `h1` → `h2` → `h3` in the current composition.
- Forward step navigation focuses the new heading.
- The current content remains usable without audio or a guitar.
- No implemented information depends only on color.
- Reduced-motion behavior is not yet applicable because this slice contains no animation or simulation.

Accessibility is not ready for sign-off because repeated primitive instances would create duplicate IDs (MEDIUM-02), several controls miss the specified touch-target size (MEDIUM-05), and reverse navigation does not restore focus to the new step heading (MEDIUM-06). The storage status also needs to accurately announce the fallback state when persistence is unavailable (MEDIUM-03).

## Architecture assessment

- **Is there premature abstraction?** No. The implementation avoided a universal lesson renderer, universal schema, storage framework, migrations, and speculative exercise components.
- **Is there too much lesson-specific logic in generic components?** No significant excess was found. The generic primitives receive educational content through props and do not contain facts about sound. `ChoiceQuestion` does need the minimal result callback described in MEDIUM-01, but it should not become a broader state machine.
- **Is there too much generic logic in `LessonOnePage`?** No. Progress and lesson composition appropriately remain in the lesson page for this vertical slice. Persistence is also acceptably local at this stage.
- **Are the current abstractions justified by actual use?** Yes. `LessonShell`, `LessonStep`, `ChoiceQuestion`, and `RealWorldExperiment` are the four primitives explicitly justified by the specification. Their boundaries should remain narrow while the identified defects are corrected.
- **Is the current foundation suitable for implementing `VirtualGuitarString` next?** Not yet. It is close, but MEDIUM-01 through MEDIUM-06 should be fixed first so step 4 does not build on an opaque question API, ambiguous IDs, misleading persistence/audio UI, or incomplete navigation accessibility.

## Validation results

The following commands were actually executed during the review:

- `pnpm build` under the shell’s default Node 16.19.1: did not reach the project build because the installed pnpm/Corepack runtime failed with `TypeError: Invalid host defined options`.
- `/home/okirienko/.nvm/versions/node/v22.23.1/bin/node /home/okirienko/.cache/node/corepack/pnpm/11.9.0/bin/pnpm.cjs build`: TypeScript completed, but the Vite subprocess still resolved Node 16.19.1 through `PATH` and failed because Vite requires Node 20.19+ or 22.12+.
- `env PATH=/home/okirienko/.nvm/versions/node/v22.23.1/bin:/home/okirienko/.local/bin:/home/okirienko/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin /home/okirienko/.nvm/versions/node/v22.23.1/bin/node /home/okirienko/.cache/node/corepack/pnpm/11.9.0/bin/pnpm.cjs build`: passed under Node 22.23.1. Vite transformed 1,233 modules and produced the production bundle.
- `env PATH=/home/okirienko/.nvm/versions/node/v22.23.1/bin:/home/okirienko/.local/bin:/home/okirienko/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin /home/okirienko/.nvm/versions/node/v22.23.1/bin/node /home/okirienko/.cache/node/corepack/pnpm/11.9.0/bin/pnpm.cjs lint`: passed (`tsc -b --pretty false`).
- `git diff --check`: passed with no whitespace errors.

No test command is defined in `package.json`, so no automated test suite was run.

The Node 16 failures were review-environment/runtime-selection issues, not application-code failures. The project checks passed once both pnpm and its child processes used Node 22.23.1.

## Recommended next action

Fix MEDIUM-01, MEDIUM-02, MEDIUM-03, MEDIUM-04, MEDIUM-05, and MEDIUM-06 with minimal, targeted changes, then re-review those fixes before proceeding to implementation step 4.

Do not expand the fix scope into `VirtualGuitarString`, audio, propagation, checkpoint, or completion work.

## Handoff notes

- The approved specification at `docs/lesson-designs/stage-01-lesson-01-sound.md` remains the source of truth.
- This artifact contains the findings from `stage-01-lesson-01 / review-01-foundation`.
- Fixes should be minimal and targeted to the listed finding IDs.
- Avoid unrelated refactoring and preserve the decisions listed under “What is good and should remain unchanged.”
- Optional improvements should not be implemented automatically; this review identified none that warrant work in the current slice.
