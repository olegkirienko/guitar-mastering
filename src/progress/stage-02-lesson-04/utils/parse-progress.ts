import type { LessonNineStepId } from '@/data/lessons/stage-02-lesson-04/types';
import { defaultLessonNineProgress, lessonNineStepOrder } from '@/progress/stage-02-lesson-04/constants';
import type { LessonNineProgress } from '@/progress/stage-02-lesson-04/types';

function validStep(value: unknown): value is LessonNineStepId {
  return typeof value === 'string' && lessonNineStepOrder.includes(value as LessonNineStepId);
}

// Each completed step unlocks the next one in order; `complete` unlocks only
// once the checkpoint rules set checkpointPassed.
function highestUnlockedStep(completedStepIds: readonly LessonNineStepId[], checkpointPassed: boolean): LessonNineStepId {
  if (checkpointPassed) return 'complete';
  let unlocked: LessonNineStepId = 'intro';
  for (const [index, step] of lessonNineStepOrder.entries()) {
    if (step === 'checkpoint' || !completedStepIds.includes(step)) break;
    unlocked = lessonNineStepOrder[index + 1];
  }
  return unlocked;
}

export function parseLessonNineProgress(value: unknown): LessonNineProgress {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return defaultLessonNineProgress;
  const progress = value as Partial<LessonNineProgress>;
  const completedAt = typeof progress.completedAt === 'string' && Number.isFinite(Date.parse(progress.completedAt))
    ? new Date(progress.completedAt).toISOString()
    : null;
  const completedStepIds = Array.isArray(progress.completedStepIds)
    ? lessonNineStepOrder.filter((step) => progress.completedStepIds?.includes(step))
    : [];
  const requestedStep = validStep(progress.currentStepId)
    ? progress.currentStepId
    : completedAt
      ? 'complete'
      : 'intro';
  return normalizeLessonNineProgress({
    currentStepId: requestedStep,
    completedStepIds,
    checkpointPassed: progress.checkpointPassed === true,
    completedAt,
  });
}

export function normalizeLessonNineProgress(progress: LessonNineProgress): LessonNineProgress {
  const checkpointPassed = progress.checkpointPassed || progress.completedAt !== null;
  const completed = new Set(progress.completedStepIds);
  if (progress.completedAt !== null) {
    completed.add('checkpoint');
    completed.add('complete');
  }
  const completedStepIds = lessonNineStepOrder.filter((step) => completed.has(step));
  const unlockedRank = lessonNineStepOrder.indexOf(highestUnlockedStep(completedStepIds, checkpointPassed));
  const requestedRank = lessonNineStepOrder.indexOf(progress.currentStepId);
  return {
    ...progress,
    currentStepId: lessonNineStepOrder[Math.min(requestedRank === -1 ? 0 : requestedRank, unlockedRank)] ?? 'intro',
    completedStepIds,
    checkpointPassed,
  };
}
