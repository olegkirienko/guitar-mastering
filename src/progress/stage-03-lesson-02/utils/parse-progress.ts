import type { LessonTwelveStepId } from '@/data/lessons/stage-03-lesson-02/types';
import { defaultLessonTwelveProgress, lessonTwelveStepOrder } from '@/progress/stage-03-lesson-02/constants';
import type { LessonTwelveProgress } from '@/progress/stage-03-lesson-02/types';

function validStep(value: unknown): value is LessonTwelveStepId {
  return typeof value === 'string' && lessonTwelveStepOrder.includes(value as LessonTwelveStepId);
}

// Each completed step unlocks the next one in order; `complete` unlocks only
// once the checkpoint rules set checkpointPassed.
function highestUnlockedStep(completedStepIds: readonly LessonTwelveStepId[], checkpointPassed: boolean): LessonTwelveStepId {
  if (checkpointPassed) return 'complete';
  let unlocked: LessonTwelveStepId = 'intro';
  for (const [index, step] of lessonTwelveStepOrder.entries()) {
    if (step === 'checkpoint' || !completedStepIds.includes(step)) break;
    unlocked = lessonTwelveStepOrder[index + 1];
  }
  return unlocked;
}

export function parseLessonTwelveProgress(value: unknown): LessonTwelveProgress {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return defaultLessonTwelveProgress;
  const progress = value as Partial<LessonTwelveProgress>;
  const completedAt = typeof progress.completedAt === 'string' && Number.isFinite(Date.parse(progress.completedAt))
    ? new Date(progress.completedAt).toISOString()
    : null;
  const completedStepIds = Array.isArray(progress.completedStepIds)
    ? lessonTwelveStepOrder.filter((step) => progress.completedStepIds?.includes(step))
    : [];
  const requestedStep = validStep(progress.currentStepId)
    ? progress.currentStepId
    : completedAt
      ? 'complete'
      : 'intro';
  return normalizeLessonTwelveProgress({
    currentStepId: requestedStep,
    completedStepIds,
    checkpointPassed: progress.checkpointPassed === true,
    completedAt,
  });
}

export function normalizeLessonTwelveProgress(progress: LessonTwelveProgress): LessonTwelveProgress {
  const checkpointPassed = progress.checkpointPassed || progress.completedAt !== null;
  const completed = new Set(progress.completedStepIds);
  if (progress.completedAt !== null) {
    completed.add('checkpoint');
    completed.add('complete');
  }
  const completedStepIds = lessonTwelveStepOrder.filter((step) => completed.has(step));
  const unlockedRank = lessonTwelveStepOrder.indexOf(highestUnlockedStep(completedStepIds, checkpointPassed));
  const requestedRank = lessonTwelveStepOrder.indexOf(progress.currentStepId);
  return {
    ...progress,
    currentStepId: lessonTwelveStepOrder[Math.min(requestedRank === -1 ? 0 : requestedRank, unlockedRank)] ?? 'intro',
    completedStepIds,
    checkpointPassed,
  };
}
