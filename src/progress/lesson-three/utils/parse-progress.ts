import type { LessonThreeStepId } from '@/data/lessons/stage-01-lesson-03/types';
import { defaultLessonThreeProgress, lessonThreeStepOrder } from '@/progress/lesson-three/constants';
import type { LessonThreeProgress } from '@/progress/lesson-three/types';

function validStep(value: unknown): value is LessonThreeStepId {
  return typeof value === 'string' && lessonThreeStepOrder.includes(value as LessonThreeStepId);
}

// Each completed step unlocks the next one in order; `complete` unlocks only
// once the checkpoint rules set checkpointPassed.
function highestUnlockedStep(completedStepIds: readonly LessonThreeStepId[], checkpointPassed: boolean): LessonThreeStepId {
  if (checkpointPassed) return 'complete';
  let unlocked: LessonThreeStepId = 'intro';
  for (const [index, step] of lessonThreeStepOrder.entries()) {
    if (step === 'checkpoint' || !completedStepIds.includes(step)) break;
    unlocked = lessonThreeStepOrder[index + 1];
  }
  return unlocked;
}

export function parseLessonThreeProgress(value: unknown): LessonThreeProgress {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return defaultLessonThreeProgress;
  const progress = value as Partial<LessonThreeProgress>;
  const completedAt = typeof progress.completedAt === 'string' && Number.isFinite(Date.parse(progress.completedAt))
    ? new Date(progress.completedAt).toISOString()
    : null;
  const completedStepIds = Array.isArray(progress.completedStepIds)
    ? lessonThreeStepOrder.filter((step) => progress.completedStepIds?.includes(step))
    : [];
  const requestedStep = validStep(progress.currentStepId)
    ? progress.currentStepId
    : completedAt
      ? 'complete'
      : 'intro';
  return normalizeLessonThreeProgress({
    currentStepId: requestedStep,
    completedStepIds,
    checkpointPassed: progress.checkpointPassed === true,
    completedAt,
  });
}

export function normalizeLessonThreeProgress(progress: LessonThreeProgress): LessonThreeProgress {
  const checkpointPassed = progress.checkpointPassed || progress.completedAt !== null;
  const completed = new Set(progress.completedStepIds);
  if (progress.completedAt !== null) {
    completed.add('checkpoint');
    completed.add('complete');
  }
  const completedStepIds = lessonThreeStepOrder.filter((step) => completed.has(step));
  const unlockedRank = lessonThreeStepOrder.indexOf(highestUnlockedStep(completedStepIds, checkpointPassed));
  const requestedRank = lessonThreeStepOrder.indexOf(progress.currentStepId);
  return {
    ...progress,
    currentStepId: lessonThreeStepOrder[Math.min(requestedRank === -1 ? 0 : requestedRank, unlockedRank)] ?? 'intro',
    completedStepIds,
    checkpointPassed,
  };
}
