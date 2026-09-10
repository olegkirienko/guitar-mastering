# Stage I · Lesson 1 — Foundation Fixes Re-Review

## Review metadata

- Review date: 2026-09-10
- Review scope: targeted re-review of MEDIUM-01 through MEDIUM-06 from implementation steps 1–3
- Current git commit / HEAD SHA: `6296c4c57ce16c063aeffd100b0269c80184ef4a`
- Specification path: `docs/lesson-designs/stage-01-lesson-01-sound.md`
- Previous review artifact: `docs/reviews/stage-01-lesson-01/review-01-foundation.md`
- Artifact identifier: `stage-01-lesson-01 / review-02-foundation-fixes`

## Final verdict

**CHANGES REQUIRED**

MEDIUM-01 through MEDIUM-05 are fixed with appropriately narrow changes. MEDIUM-06 is only partially fixed: forward and backward in-page navigation focus the newly rendered heading, and the introduction does not focus on its normal initial render, but resuming directly at the persisted string step still autofocuses that heading during initial page load. That remaining edge case should be corrected before proceeding to implementation step 4.

## Finding verification

### MEDIUM-01

Status: FIXED

- Verification summary: `ChoiceQuestion` now exposes the lesson-specific result at check time while retaining its own selection and feedback state.
- Evidence from the implementation: `src/components/lesson/ChoiceQuestion.tsx:5–16` adds the optional `onCheck(choiceId, isCorrect)` callback and invokes it only when the learner activates the check button. `selectedId` and `checked` remain local `useState` values.
- Recommended fix: Followed. The implemented callback matches the previously recommended minimal API and provides both the selected identifier and correctness needed by a future prediction flow.
- Component minimality: Preserved. The component is not controlled, introduces no duplicated caller state or generic state machine, and adds no speculative interaction API.

### MEDIUM-02

Status: FIXED

- Verification summary: Reusable instances now create component-local, React-safe IDs, so repeated instances do not share document IDs.
- Evidence from the implementation: `src/components/lesson/LessonStep.tsx:7–10` generates `titleId` with `useId()` and uses the same value for the section's `aria-labelledby` and its `h2` ID. `src/components/lesson/RealWorldExperiment.tsx:6–7` does the equivalent for the `aside` and `h3`. `ChoiceQuestion` also uses its own `useId()` value for the radio group name and feedback association.
- Recommended fix: Followed. React `useId()` replaced fixed IDs without requiring IDs from callers.
- Component minimality: Preserved. No ID registry, naming convention, or caller-managed ID prop was introduced.

### MEDIUM-03

Status: FIXED

- Verification summary: Read and write failures are detected, the lesson continues using in-memory React state, and the save-status message switches to a session-only statement when persistence is unavailable.
- Evidence from the implementation: `src/pages/LessonOnePage.tsx:13–28` returns `storageAvailable: false` when `localStorage.getItem` throws and safely falls back to default progress for absent, malformed, or structurally invalid values. `src/pages/LessonOnePage.tsx:31–36` keeps progress locally and marks storage unavailable when `setItem` throws. `src/pages/LessonOnePage.tsx:40–42` conditionally reports device persistence or session-only progress through a polite live region.
- Recommended fix: Followed. A local boolean was added around the existing page-local persistence logic.
- Component minimality: Preserved. No storage service, schema version, migration layer, or new persistence abstraction was introduced.

### MEDIUM-04

Status: FIXED

- Verification summary: The premature audio preference functionality is removed completely from this slice.
- Evidence from the implementation: `src/pages/LessonOnePage.tsx` contains no `audioEnabled` state, audio control, audio icon import, persisted audio field, or audio event behavior. The remaining sentence at line 46 only explains that audio is optional and does not create a preference or placeholder abstraction.
- Recommended fix: Followed. The no-op toggle and its persisted preference were removed until audio has actual behavior in implementation step 5.
- Component minimality: Preserved. No replacement audio hook, service, state object, or placeholder component was added.

### MEDIUM-05

Status: FIXED

- Verification summary: The affected controls now provide approximately 44 px minimum touch height while retaining normal native keyboard behavior and reasonable compact styling.
- Evidence from the implementation: `src/components/lesson/LessonShell.tsx:19`, `src/pages/LessonOnePage.tsx:45`, `src/pages/LessonOnePage.tsx:52`, and `src/components/lesson/ChoiceQuestion.tsx:16` use Tailwind's `min-h-11` (2.75 rem / 44 px). The text navigation controls also retain inline padding, and their text makes them wider than 44 px. `ChoiceQuestion` radio labels remain fully clickable padded labels (`p-4`) at line 15.
- Recommended fix: Followed. The change is limited to minimum height and appropriate inline padding.
- Component minimality: Preserved. Native links, buttons, and radio inputs remain in use; keyboard activation, disabled behavior, and visible focus styles were not degraded.

### MEDIUM-06

Status: PARTIALLY FIXED

- Verification summary: Explicit forward navigation focuses the string-step `h2`, and explicit backward navigation now focuses the introduction `h2`. The normal introduction-first load does not autofocus. However, an initial load that restores persisted `currentStepId: 'string'` renders `LessonStep` with unconditional `shouldFocus`, so its mount effect moves focus even though no in-page navigation occurred.
- Evidence from the implementation: `src/pages/LessonOnePage.tsx:34`, `src/pages/LessonOnePage.tsx:37`, and `src/pages/LessonOnePage.tsx:43` use `shouldFocusIntro` to distinguish backward navigation from the initial introduction render. `src/pages/LessonOnePage.tsx:48` always supplies `shouldFocus` to the string step. `src/components/lesson/LessonStep.tsx:6–10` focuses the `h2` on mount whenever that prop is true. Because `readProgress()` can restore the string step at lines 13–26, this also fires on a resumed initial page load.
- Recommended fix: Partially followed. The back-navigation loss is corrected and the introduction's initial autofocus is avoided, but focus intent is not yet distinguished from a persisted initial string render.
- Component minimality: Preserved. The remaining correction should stay within the existing small focus prop/state approach; no focus manager or navigation state machine is warranted.

## Regressions introduced

None.

The remaining initial-load focus issue in MEDIUM-06 is an incomplete correction of that finding, not a regression caused by otherwise working behavior.

## What should remain unchanged

- Keep choice selection and checked state local to `ChoiceQuestion`; retain only the minimal `onCheck(choiceId, isCorrect)` notification.
- Keep IDs generated inside reusable primitives with `useId()`.
- Keep persistence and its availability flag local to `LessonOnePage`; do not introduce a storage framework, migrations, or a generic lesson state engine.
- Keep audio controls and persisted audio preference out of steps 1–3.
- Keep native controls, padded radio labels, `min-h-11` touch targets, and the current visible focus styling.
- Keep `LessonShell`, `LessonStep`, and `RealWorldExperiment` narrowly scoped, with educational content in the lesson-specific data module.

## Scope compliance

The fixes stayed within the six requested findings and implementation steps 1–3. Inspection of the current source diff and untracked implementation files found no fix-driven unrelated refactoring, premature abstraction, duplicated interaction state, new dependency, or implementation of the virtual string, audio, propagation, checkpoint, or completion flows. The only new effect remains the existing narrow persistence write effect; the focus effect in `LessonStep` remains necessary for step navigation.

## Accessibility assessment

The fixes improve the touched accessibility areas as intended: repeated primitive instances have valid unique label associations; affected actions meet the 44 px target; native keyboard behavior and visible focus treatment remain intact; radio labels remain comfortably sized; and storage fallback status is announced through a polite live region. Focus is correctly restored after explicit forward and backward step navigation, but the persisted string-step initial-load autofocus must still be prevented.

## Validation results

The following commands were actually executed:

- An initial environment-selection attempt using `PATH=/home/okirienko/.nvm/versions/node/v24.7.0/bin:...` failed before validation because that patch version is not installed and `pnpm` was therefore not found. No project failure was observed in this attempt.
- `env PATH=/home/okirienko/.nvm/versions/node/v24.3.0/bin:... node -v`: reported `v24.3.0`, matching the major version in `.nvmrc` (`24`).
- `env PATH=/home/okirienko/.nvm/versions/node/v24.3.0/bin:... corepack pnpm build`: passed. TypeScript completed, Vite 7.3.6 transformed 1,233 modules, and the production bundle was generated.
- `env PATH=/home/okirienko/.nvm/versions/node/v24.3.0/bin:... corepack pnpm lint`: passed (`tsc -b --pretty false`). This is the project's defined lint/typecheck command.
- `git diff --check`: passed with no reported whitespace errors.

No test script is defined in `package.json`, so no automated test suite was run.

## Recommended next action

perform another targeted fix cycle

## Handoff notes

Before changing the remaining focus edge case, read the approved specification at `docs/lesson-designs/stage-01-lesson-01-sound.md`, the original findings in `docs/reviews/stage-01-lesson-01/review-01-foundation.md`, and this re-review. Limit the next change to distinguishing explicit forward navigation from a persisted initial render so both forward and backward navigation focus the new `h2` while all initial page-load paths leave focus undisturbed. Re-run the existing build, lint/typecheck, and diff checks before starting implementation step 4.
