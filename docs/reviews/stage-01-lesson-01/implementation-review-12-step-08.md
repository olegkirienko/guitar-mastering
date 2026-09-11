# Stage I · Lesson 1 — Step 08 `Checkpoint` Implementation Review

## Review metadata

- Review date: 2026-09-11
- Review scope: implementation step 08, checkpoint sequence and completion rules
- Current HEAD SHA: `b8bc15ea312f3445b374e81a9d0109eb7316aea4`
- Specification: `docs/lesson-designs/stage-01-lesson-01-sound.md`
- Approved prior-slice review: `docs/reviews/stage-01-lesson-01/implementation-review-11-step-07.md`
- Workflow state: `docs/workflow/stage-01-lesson-01.yaml`
- Artifact identifier: `stage-01-lesson-01 / implementation-review-12-step-08`

## Final verdict

**APPROVED**

The slice implements the approved five-card causal checkpoint, concrete first-break feedback, an explanatory fallback after two failed attempts, the required control question, and persisted checkpoint completion. It keeps sorting available through both drag-and-drop and native buttons, announces button-driven position changes, and provides the completed causal model as text. The work remains within Step 08: no lesson-completion, reflection, bridge, or next-lesson behavior was introduced.

## Findings

No actionable findings.

## Checkpoint behavior

- The five cards, deliberately mixed initial order, control question, three response choices, causal summary, and guitar/no-guitar application are held in lesson content rather than generic UI (`src/data/lessons/stage-01-lesson-01.ts:67–94`).
- Learners can reorder without restriction by dragging or by using the “Раніше” and “Пізніше” buttons; moves reset stale result feedback and announce the new numbered position (`src/components/lesson/SoundPathCheckpoint.tsx:47–69, 93–125`).
- A check compares the whole sequence while visually and textually identifying only correctly joined adjacent pairs (`src/components/lesson/SoundPathCheckpoint.tsx:71–75, 99–123`).
- An incorrect attempt receives a concrete hint for the first causal break. After the second failed check, “Показати й пояснити” restores and explains the correct sequence (`src/components/lesson/SoundPathCheckpoint.tsx:77–84, 127–138`).
- Whether independently ordered or shown after explanation, the learner must still answer the control question correctly before the checkpoint passes (`src/components/lesson/SoundPathCheckpoint.tsx:134–146`).

## Accessibility, progress, and scope

- Card positions are visibly numbered, all button targets meet the existing minimum height convention, native controls retain visible focus styling, and decorative illustrations are hidden from assistive technology (`src/components/lesson/SoundPathCheckpoint.tsx:99–125`).
- Movement announcements use an atomic polite live region; incorrect, sequence-ready, and passed outcomes use status semantics and textual feedback (`src/components/lesson/SoundPathCheckpoint.tsx:86–91, 125–145`).
- The checkpoint route unlocks only after the air step is complete, receives managed heading focus, supports returning to the air experiment, and occupies progress stop five (`src/pages/LessonOnePage.tsx:43–62, 89–100`).
- `checkpointPassed` and the completed checkpoint step are stored with the established local lesson progress, while older stored data safely defaults the new field to false (`src/pages/LessonOnePage.tsx:11–33, 97–99`).
- No dependency, universal sequence abstraction, lesson-completion screen, `completedAt`, reflection, high/low-sound bridge, or future-lesson terminology was added.

## Validation results

The following commands were actually executed:

- Initial `node -v`: reported `v16.19.1`, which did not match `.nvmrc`; the associated initial `corepack pnpm lint` and `corepack pnpm build` attempts failed before running their scripts because that old runtime could not execute the installed pnpm launcher.
- `env PATH=/home/okirienko/.nvm/versions/node/v24.3.0/bin:/usr/local/bin:/usr/bin:/bin node -v`: passed and reported `v24.3.0`, matching `.nvmrc` major version `24`.
- `env PATH=/home/okirienko/.nvm/versions/node/v24.3.0/bin:/usr/local/bin:/usr/bin:/bin corepack pnpm lint`: passed (`tsc -b --pretty false`).
- `env PATH=/home/okirienko/.nvm/versions/node/v24.3.0/bin:/usr/local/bin:/usr/bin:/bin corepack pnpm build`: passed. Vite 7.3.6 transformed 1,237 modules and generated the production bundle.
- `git diff --check`: passed with no whitespace errors.

No `test` script is defined in `package.json`, so no automated test suite was run. No browser automation or screen-reader harness is present; interaction, retry, persistence, semantic, keyboard-alternative, and scope behavior were reviewed directly from component state and rendered markup.

## Scope decision

Step 08 is approved. Stop at the `next_slice_approval` human gate. Do not begin Step 09 lesson completion and bridge work until explicit human approval.

## Exact verdict

APPROVED
