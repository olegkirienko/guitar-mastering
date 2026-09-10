# Stage I · Lesson 1 — Step 07 `ReducedMotionAndScreenReader` Implementation Review

## Review metadata

- Review date: 2026-09-10
- Review scope: implementation step 07, reduced-motion and screen-reader behavior
- Current HEAD SHA: `21d92a0b7b3870b8a17b57f76eb7fb155965af7f`
- Specification: `docs/lesson-designs/stage-01-lesson-01-sound.md`
- Approved prior-slice review: `docs/reviews/stage-01-lesson-01/fix-rereview-10-step-06.md`
- Workflow state: `docs/workflow/stage-01-lesson-01.yaml`
- Artifact identifier: `stage-01-lesson-01 / implementation-review-11-step-07`

## Final verdict

**APPROVED**

The slice implements the approved reduced-motion and screen-reader layer without adding checkpoint, lesson-completion, or future-lesson work. It honors the system reduced-motion preference, provides a persisted manual static-mode preference, replaces automatic movement with learner-controlled frames, exposes concise live summaries, provides the propagation transcript, and hides decorative SVG internals behind single described images. Both animated and static routes continue to reach the same observation and concept-reveal flow.

## Findings

No actionable findings.

## Reduced-motion behavior

- `LessonOnePage` observes `prefers-reduced-motion: reduce`, combines it with the learner's manual preference, and passes one consistent mode to both experiments (`src/pages/LessonOnePage.tsx:10–52, 61–86`).
- The manual “Показувати покадрово” preference is stored with lesson progress and safely defaults for older or malformed stored data (`src/pages/LessonOnePage.tsx:10–31, 45, 66–68`).
- Entering static mode stops automatic string and propagation playback rather than allowing motion to continue behind the static controls (`src/components/lesson/VirtualGuitarString.tsx:42–82`; `src/components/lesson/SoundPropagationLab.tsx:70–102`).
- The string uses three labeled, learner-controlled positions; the propagation model uses four learner-controlled causal phases with Back/Next completion controls (`src/components/lesson/VirtualGuitarString.tsx:17–21, 262–274, 324–333`; `src/components/lesson/SoundPropagationLab.tsx:29–31, 101–145, 217–228`).
- No continuous animation, transition, or automatic frame timer runs while static mode is active. Audio remains opt-in and user-triggered.

## Screen-reader and keyboard behavior

- Each main SVG is exposed as one named and described image, while its decorative geometry and marker nodes are hidden from the accessibility tree (`src/components/lesson/VirtualGuitarString.tsx:291–304`; `src/components/lesson/SoundPropagationLab.tsx:173–211`).
- String and propagation state changes use atomic polite live summaries. Static summaries include the current frame number and a textual causal description (`src/components/lesson/VirtualGuitarString.tsx:306–309`; `src/components/lesson/SoundPropagationLab.tsx:212–214`).
- The propagation laboratory includes an explicit four-phase textual transcript that communicates the complete route without audio or animation (`src/components/lesson/SoundPropagationLab.tsx:231–238`).
- All new controls are native buttons, retain visible focus treatment and minimum target height, and follow DOM order without custom keyboard shortcuts.

## Pedagogy, scope, and regressions

- Prediction still precedes access to the propagation model, and “звукова хвиля” remains withheld until the learner has observed the model and answered or retried the observation question.
- The static route reaches the same observation and reveal as animated playback through the existing `modelObserved` state.
- The approved string/body/air/ear model, source-stop behavior, optional audio behavior, and real-world experiments remain intact.
- No checkpoint, sequence builder, completion screen, next-lesson terminology, new dependency, or speculative abstraction was introduced.

## Validation results

The following commands were actually executed with the Node version selected by `.nvmrc`:

- `/home/okirienko/.nvm/versions/node/v24.3.0/bin/node -v`: passed and reported `v24.3.0`, matching `.nvmrc` major version `24`.
- `env PATH=/home/okirienko/.nvm/versions/node/v24.3.0/bin:... corepack pnpm lint`: passed (`tsc -b --pretty false`).
- `env PATH=/home/okirienko/.nvm/versions/node/v24.3.0/bin:... corepack pnpm build`: passed. Vite 7.3.6 transformed 1,236 modules and generated the production bundle.
- `git diff --check`: passed with no whitespace errors.

No `test` script is defined in `package.json`, so no automated test suite was run. No browser automation or screen-reader harness is present; interaction, reduced-motion, semantic, and SVG exposure behavior were reviewed directly from the component state and rendered markup.

## Scope decision

Step 07 is approved. Stop at the `next_slice_approval` human gate. Do not begin step 08 checkpoint work until explicit human approval.

## Exact verdict

APPROVED
