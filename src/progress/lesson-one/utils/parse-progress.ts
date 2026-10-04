import type { LessonOneStepId } from '@/data/lessons/stage-01-lesson-01/types';
import { defaultLessonOneProgress, lessonOneStepOrder } from '@/progress/lesson-one/constants';
import type { LessonOneProgress } from '@/progress/lesson-one/types';

function validStep(value: unknown): value is LessonOneStepId {
  return typeof value === 'string' && lessonOneStepOrder.includes(value as LessonOneStepId);
}

export function parseLessonOneProgress(value: unknown): LessonOneProgress {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return defaultLessonOneProgress;
  const progress = value as Partial<LessonOneProgress>;
  const completedAt = typeof progress.completedAt === 'string' && Number.isFinite(Date.parse(progress.completedAt))
    ? new Date(progress.completedAt).toISOString()
    : null;
  const checkpointPassed = progress.checkpointPassed === true || completedAt !== null;
  const completedStepIds = Array.isArray(progress.completedStepIds)
    ? lessonOneStepOrder.filter((step) => progress.completedStepIds?.includes(step))
    : [];
  if (completedAt) {
    if (!completedStepIds.includes('checkpoint')) completedStepIds.push('checkpoint');
    if (!completedStepIds.includes('complete')) completedStepIds.push('complete');
  }
  const requestedStep = validStep(progress.currentStepId)
    ? progress.currentStepId
    : completedAt
      ? 'complete'
      : 'intro';
  return normalizeLessonOneProgress({
    currentStepId: requestedStep,
    completedStepIds,
    checkpointPassed,
    completedAt,
  });
}

export function normalizeLessonOneProgress(progress: LessonOneProgress): LessonOneProgress {
  const completedStepIds = lessonOneStepOrder.filter((step) => progress.completedStepIds.includes(step));
  const checkpointPassed = progress.checkpointPassed || progress.completedAt !== null;
  const highestUnlocked = checkpointPassed
    ? 'complete'
    : completedStepIds.includes('air')
      ? 'checkpoint'
      : completedStepIds.includes('string')
        ? 'air'
        : completedStepIds.includes('intro')
          ? 'string'
          : 'intro';
  const requestedRank = lessonOneStepOrder.indexOf(progress.currentStepId);
  const unlockedRank = lessonOneStepOrder.indexOf(highestUnlocked);
  return {
    ...progress,
    currentStepId: lessonOneStepOrder[Math.min(requestedRank, unlockedRank)] ?? 'intro',
    completedStepIds,
    checkpointPassed,
  };
}
