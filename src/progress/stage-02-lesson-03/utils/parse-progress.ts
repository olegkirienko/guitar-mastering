import type { LessonEightStepId } from '@/data/lessons/stage-02-lesson-03/types';
import { defaultLessonEightProgress, lessonEightStepOrder } from '@/progress/stage-02-lesson-03/constants';
import type { LessonEightProgress } from '@/progress/stage-02-lesson-03/types';

function validStep(value: unknown): value is LessonEightStepId {
  return typeof value === 'string' && lessonEightStepOrder.includes(value as LessonEightStepId);
}

// Each completed step unlocks the next one in order; `complete` unlocks only
// once the checkpoint rules set checkpointPassed.
function highestUnlockedStep(completedStepIds: readonly LessonEightStepId[], checkpointPassed: boolean): LessonEightStepId {
  if (checkpointPassed) return 'complete';
  let unlocked: LessonEightStepId = 'intro';
  for (const [index, step] of lessonEightStepOrder.entries()) {
    if (step === 'checkpoint' || !completedStepIds.includes(step)) break;
    unlocked = lessonEightStepOrder[index + 1];
  }
  return unlocked;
}

export function parseLessonEightProgress(value: unknown): LessonEightProgress {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return defaultLessonEightProgress;
  const progress = value as Partial<LessonEightProgress>;
  const completedAt = typeof progress.completedAt === 'string' && Number.isFinite(Date.parse(progress.completedAt))
    ? new Date(progress.completedAt).toISOString()
    : null;
  const completedStepIds = Array.isArray(progress.completedStepIds)
    ? lessonEightStepOrder.filter((step) => progress.completedStepIds?.includes(step))
    : [];
  const requestedStep = validStep(progress.currentStepId)
    ? progress.currentStepId
    : completedAt
      ? 'complete'
      : 'intro';
  return normalizeLessonEightProgress({
    currentStepId: requestedStep,
    completedStepIds,
    checkpointPassed: progress.checkpointPassed === true,
    completedAt,
  });
}

export function normalizeLessonEightProgress(progress: LessonEightProgress): LessonEightProgress {
  const checkpointPassed = progress.checkpointPassed || progress.completedAt !== null;
  const completed = new Set(progress.completedStepIds);
  if (progress.completedAt !== null) {
    completed.add('checkpoint');
    completed.add('complete');
  }
  const completedStepIds = lessonEightStepOrder.filter((step) => completed.has(step));
  const unlockedRank = lessonEightStepOrder.indexOf(highestUnlockedStep(completedStepIds, checkpointPassed));
  const requestedRank = lessonEightStepOrder.indexOf(progress.currentStepId);
  return {
    ...progress,
    currentStepId: lessonEightStepOrder[Math.min(requestedRank === -1 ? 0 : requestedRank, unlockedRank)] ?? 'intro',
    completedStepIds,
    checkpointPassed,
  };
}
