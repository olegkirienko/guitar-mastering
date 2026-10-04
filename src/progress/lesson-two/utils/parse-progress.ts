import type { LessonTwoStepId } from '@/data/lessons/stage-01-lesson-02/types';
import { defaultLessonTwoProgress, lessonTwoStepOrder } from '@/progress/lesson-two/constants';
import type { LessonTwoProgress } from '@/progress/lesson-two/types';

function validStep(value: unknown): value is LessonTwoStepId {
  return typeof value === 'string' && lessonTwoStepOrder.includes(value as LessonTwoStepId);
}

// Each completed step unlocks the next one in order; `complete` unlocks only
// once the checkpoint rules set checkpointPassed.
function highestUnlockedStep(completedStepIds: readonly LessonTwoStepId[], checkpointPassed: boolean): LessonTwoStepId {
  if (checkpointPassed) return 'complete';
  let unlocked: LessonTwoStepId = 'intro';
  for (const [index, step] of lessonTwoStepOrder.entries()) {
    if (step === 'checkpoint' || !completedStepIds.includes(step)) break;
    unlocked = lessonTwoStepOrder[index + 1];
  }
  return unlocked;
}

export function parseLessonTwoProgress(value: unknown): LessonTwoProgress {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return defaultLessonTwoProgress;
  const progress = value as Partial<LessonTwoProgress>;
  const completedAt = typeof progress.completedAt === 'string' && Number.isFinite(Date.parse(progress.completedAt))
    ? new Date(progress.completedAt).toISOString()
    : null;
  const completedStepIds = Array.isArray(progress.completedStepIds)
    ? lessonTwoStepOrder.filter((step) => progress.completedStepIds?.includes(step))
    : [];
  const requestedStep = validStep(progress.currentStepId)
    ? progress.currentStepId
    : completedAt
      ? 'complete'
      : 'intro';
  return normalizeLessonTwoProgress({
    currentStepId: requestedStep,
    completedStepIds,
    checkpointPassed: progress.checkpointPassed === true,
    completedAt,
  });
}

export function normalizeLessonTwoProgress(progress: LessonTwoProgress): LessonTwoProgress {
  const checkpointPassed = progress.checkpointPassed || progress.completedAt !== null;
  const completed = new Set(progress.completedStepIds);
  if (progress.completedAt !== null) {
    completed.add('checkpoint');
    completed.add('complete');
  }
  const completedStepIds = lessonTwoStepOrder.filter((step) => completed.has(step));
  const unlockedRank = lessonTwoStepOrder.indexOf(highestUnlockedStep(completedStepIds, checkpointPassed));
  const requestedRank = lessonTwoStepOrder.indexOf(progress.currentStepId);
  return {
    ...progress,
    currentStepId: lessonTwoStepOrder[Math.min(requestedRank === -1 ? 0 : requestedRank, unlockedRank)] ?? 'intro',
    completedStepIds,
    checkpointPassed,
  };
}
