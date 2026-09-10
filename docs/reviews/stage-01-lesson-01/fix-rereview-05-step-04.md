# Stage I · Lesson 1 — Step 04 Fix Re-Review

## Review metadata

- Review date: 2026-09-10
- Review scope: targeted re-review of `HIGH-01`, `HIGH-02`, `MEDIUM-07`, and `MEDIUM-08`, plus regressions directly caused by their fixes
- Current HEAD SHA: `85969cef2081449c51ae462d46b8fda354f0fc69`
- Specification: `docs/lesson-designs/stage-01-lesson-01-sound.md`
- Previous review artifacts: `docs/reviews/stage-01-lesson-01/implementation-review-04-step-04.md`; `docs/reviews/stage-01-lesson-01/review-01-foundation.md`; `docs/reviews/stage-01-lesson-01/review-02-foundation-fixes.md`; `docs/reviews/stage-01-lesson-01/review-03-foundation-final.md`
- Artifact identifier: `stage-01-lesson-01 / fix-rereview-05-step-04`

## Final verdict

**APPROVED**

All four active blocking findings are fixed. The prediction remains neutral until the learner performs the stop test; the no-audio path explicitly connects continuing string motion with continuing sound and compares the saved prediction with the observed result; paused and stopped presentations are physically and semantically consistent in animated and static modes; and the disabled stop action has visible state-specific guidance. No direct regression caused by these fixes was found, and all project validation passed under the Node major specified by `.nvmrc`.

## Finding verification

### HIGH-01

Status: **FIXED**

- `ChoiceQuestion` now has a narrow `prediction` mode. In that mode, every saved choice receives the same neutral `Прогноз збережено.` heading and the neutral help icon; neither the correct-choice success marker nor `Так.` is exposed before the experiment (`src/components/lesson/ChoiceQuestion.tsx:5–17`).
- The lesson invokes this mode for the stop prediction and records only the selected identifier at save time (`src/components/lesson/VirtualGuitarString.tsx:168–170`). The lesson-specific choice feedback is neutral for every prediction (`src/data/lessons/stage-01-lesson-01.ts:25–30`).
- Match or mismatch feedback remains local to `VirtualGuitarString` and is rendered only after `stop()` changes the state to `stopped` (`src/components/lesson/VirtualGuitarString.tsx:107–111`, `168–170`).

### HIGH-02

Status: **FIXED**

- Both learner questions now use the specification's sound-focused wording rather than the vague word `подія` (`src/components/lesson/VirtualGuitarString.tsx:165`, `169`; `src/data/lessons/stage-01-lesson-01.ts:25–30`).
- The visible live status explicitly pairs string motion with sound continuing and fading, supplies an equivalent static-frame statement, and reports the rapid fade after stop (`src/components/lesson/VirtualGuitarString.tsx:53–63`, `149–151`). This makes the causal observation available without audio.
- After the controlled stop, the UI shows the selected choice under `Мій прогноз`, the observed stop and fade under `Побачив/ла`, the appropriate match/mismatch framing, and the approved explanation that the moving string transfers motion to the guitar and nearby air while stopping it prevents new changes from being created (`src/components/lesson/VirtualGuitarString.tsx:43`, `168–170`).

### MEDIUM-07

Status: **FIXED**

- `stopped` and `rest` now force a zero offset, so the rendered string returns to its centered resting line instead of freezing bent (`src/components/lesson/VirtualGuitarString.tsx:39–42`).
- The stopped description takes precedence over the static-frame description, and the stopped live status reports both the centered string and rapid sound fade (`src/components/lesson/VirtualGuitarString.tsx:44–55`). This applies in animated, manual-static, and system reduced-motion modes.
- Animated pause now has its own accurate frozen-frame description and continuation guidance; static pause reports the selected frame and explains what the frame represents (`src/components/lesson/VirtualGuitarString.tsx:46–60`).

### MEDIUM-08

Status: **FIXED**

- The stop control remains natively disabled until the controlled test is active, while nearby visible helper text explains the current prerequisite: first show/pluck the string, save a prediction, start the test, or resume movement as applicable (`src/components/lesson/VirtualGuitarString.tsx:42`, `64–72`, `154–162`).
- The helper is rendered whenever stop is unavailable and is also referenced with `aria-describedby`; crucially, understanding the prerequisite does not depend on focusing the disabled button (`src/components/lesson/VirtualGuitarString.tsx:160–162`).

## Regressions introduced

None.

The `assessment` mode remains the default `ChoiceQuestion` behavior, including correct/incorrect feedback and the existing `onCheck(choiceId, isCorrect)` callback. The fixes do not alter the approved foundation persistence/focus behavior, do not add audio, and do not introduce a later lesson step.

## What should remain unchanged

- Keep prediction, playback, frame, speed, and attempt state local to `VirtualGuitarString`; persist only the completed lesson step through the existing page callback.
- Keep `ChoiceQuestion` selection and checked state local, with `prediction` as a narrow mode rather than a separate abstraction.
- Keep the experiment fully usable without audio, drag, continuous animation, or a physical guitar.
- Keep stopped-state result copy lesson-specific and do not move sound facts into the generic question primitive.
- Do not add step 5 audio or later propagation, checkpoint, reveal, or completion work as part of this approved slice.

## Scope compliance

The reviewed fixes are limited to the four active blockers. The changes add neutral prediction presentation, sound-specific lesson copy and result composition, corrected derived string presentation, and stop guidance. No dependency, route, storage framework, generic simulation framework, audio behavior, propagation model, checkpoint, or future lesson concept was added.

## Accessibility / architecture assessment

The no-audio and reduced-motion paths now communicate the same stop result as the animated path. Stopped and paused descriptions match the visible string shape; status changes are textual and exposed through the existing polite live region; and stop prerequisites remain visible even though the native disabled control cannot receive keyboard focus. Existing native buttons, radio inputs, 44 px minimum action heights, pointer fallback, and visible focus styling remain intact.

The architecture remains appropriately small: generic choice rendering owns only generic prediction/assessment presentation, while the causal experiment sequence and educational result remain in the lesson-specific component and content module.

## Validation results

The following commands were actually executed:

- The initial `node -v && pnpm -v && pnpm lint && pnpm build && git diff --check` attempt selected Node `v16.19.1`; `pnpm` failed before project validation with `TypeError: Invalid host defined options`. This was an environment-selection failure, not a project failure.
- `env PATH=/home/okirienko/.nvm/versions/node/v24.3.0/bin:... node -v`: passed and reported `v24.3.0`, matching `.nvmrc` major version `24`.
- `env PATH=/home/okirienko/.nvm/versions/node/v24.3.0/bin:... corepack pnpm lint`: passed (`tsc -b --pretty false`).
- `env PATH=/home/okirienko/.nvm/versions/node/v24.3.0/bin:... corepack pnpm build`: passed. TypeScript completed, Vite 7.3.6 transformed 1,235 modules, and the production bundle was generated.
- `git diff --check`: passed with no reported whitespace errors.

No test script is defined in `package.json`, so no automated test suite was run.

## Slice status

Implementation step 04 is approved.

## Recommended next action

Stop at the `next_slice_approval` human gate. After explicit human approval, the next legal phase is `implementation` with action `begin-next-approved-slice`.

## Handoff notes

- Active blocking findings are cleared.
- Preserve the approved virtual-string behavior when planning the next slice.
- Do not begin step 5 until the human gate is explicitly approved.
