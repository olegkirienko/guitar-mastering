# Stage I · Lesson 1 — Step 09 `LessonCompletionAndBridge` Implementation Review

## Review metadata

- Review date: 2026-09-11
- Review scope: implementation step 09, lesson completion and bridge
- Current HEAD SHA: `0442366c1474dc7d1592d1051a58fb9b72455654`
- Specification: `docs/lesson-designs/stage-01-lesson-01-sound.md`
- Approved prior-slice review: `docs/reviews/stage-01-lesson-01/implementation-review-12-step-08.md`
- Workflow state: `docs/workflow/stage-01-lesson-01.yaml`
- Artifact identifier: `stage-01-lesson-01 / implementation-review-13-step-09`

## Final verdict

**CHANGES REQUIRED**

The slice provides the specified causal-chain summary, three discoveries, optional reflection paths, explicit completion action, persisted completion timestamp, completion feedback, accessible heading focus, and a restrained bridge to high and low sounds. It stays within the lesson boundary and introduces no next-lesson explanation or interaction. One blocking resume defect remains: after completion, a learner's deliberately selected earlier step is persisted but discarded on reload.

## Findings

### MEDIUM-15 — A completed lesson cannot resume the learner's last-opened review step

- Severity: Medium
- Classification: Blocking
- File and location: `src/pages/LessonOnePage.tsx:26–36`; affected navigation at `src/pages/LessonOnePage.tsx:126, 160`
- Issue: `readProgress` assigns `currentStepId: 'complete'` whenever a valid `completedAt` exists, before considering the stored `currentStepId`. After finishing, the learner can use the approved backward navigation to review the checkpoint, air lab, string experiment, or introduction. Those actions persist the selected step while retaining `completedAt`, but a reload ignores that persisted step and reopens completion every time.
- Why it matters: The approved state model requires both completion/time and the active or last-opened step to be stored and restored. Completed sections are intentionally available for review, so completion must not make their persisted resume state ineffective.
- Required fix: Preserve a valid `completedAt` independently from current-step restoration. Restore every valid stored `currentStepId`, including `complete`; only derive `complete` from `completedAt` when the stored step is absent or invalid and that fallback is needed. Keep the completed lesson status and timestamp intact when reopening an earlier step. Add no new persistence schema or unrelated navigation behavior.
- Verification: Complete the lesson, navigate back to at least the checkpoint and one earlier experiment, reload after each navigation, and confirm the selected step resumes while `completedAt` remains stored. Reload directly from the completed result and confirm it still resumes completion.

## Approved behavior retained

- The completion route unlocks only after the approved checkpoint state and remains reachable again from that checkpoint (`src/pages/LessonOnePage.tsx:121–126`).
- The explicit completion action records `completedAt` and the completed step without requiring written or spoken reflection (`src/pages/LessonOnePage.tsx:81–85, 139–148`).
- The reflection text remains session-only and is explicitly described as not saved; no personal data, audio recording, or analytics were added (`src/pages/LessonOnePage.tsx:60–61, 139–144`).
- The result uses a live status and remounts the managed `LessonStep` heading when completion changes, allowing focus to move to the result heading (`src/pages/LessonOnePage.tsx:128, 145–148`).
- The bridge presents two visually distinct strings without numbers, asks only the approved high/low question, offers an optional real-guitar observation, and does not introduce frequency, units, formulas, or causal explanations from the next lesson (`src/pages/LessonOnePage.tsx:149–157`; `src/data/lessons/stage-01-lesson-01.ts:110–112`).
- Completion copy remains in the lesson-specific content module rather than a generic UI primitive (`src/data/lessons/stage-01-lesson-01.ts:95–113`).

## Validation results

The following commands were actually executed:

- `env PATH=/home/okirienko/.nvm/versions/node/v24.3.0/bin:/usr/local/bin:/usr/bin:/bin node -v`: passed and reported `v24.3.0`, matching `.nvmrc` major version `24`.
- `env PATH=/home/okirienko/.nvm/versions/node/v24.3.0/bin:/usr/local/bin:/usr/bin:/bin corepack pnpm lint`: passed (`tsc -b --pretty false`).
- `env PATH=/home/okirienko/.nvm/versions/node/v24.3.0/bin:/usr/local/bin:/usr/bin:/bin corepack pnpm build`: passed. Vite 7.3.6 transformed 1,237 modules and generated the production bundle.
- `git diff --check`: passed with no whitespace errors.

No `test` script is defined in `package.json`, so no automated test suite was run. No browser automation or screen-reader harness is configured; interaction, persistence, focus, semantics, scope, and content behavior were reviewed from component state, rendered markup, and the persisted-state paths.

## Scope decision

Step 09 requires a targeted fix for `MEDIUM-15`. Limit the next change to restoring a completed learner's valid last-opened step without losing completion status or timestamp. Do not revise completion content, checkpoint behavior, or future-lesson scope.

## Exact verdict

CHANGES REQUIRED
