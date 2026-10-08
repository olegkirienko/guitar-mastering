import type { LessonSevenStepId } from '@/data/lessons/stage-02-lesson-02/types';
import { defaultLessonSevenProgress, lessonSevenStepOrder } from '@/progress/stage-02-lesson-02/constants';
import type { LessonSevenProgress } from '@/progress/stage-02-lesson-02/types';

function validStep(value: unknown): value is LessonSevenStepId {
  return typeof value === 'string' && lessonSevenStepOrder.includes(value as LessonSevenStepId);
}

// Each completed step unlocks the next one in order; `complete` unlocks only
// once the checkpoint rules set checkpointPassed.
function highestUnlockedStep(completedStepIds: readonly LessonSevenStepId[], checkpointPassed: boolean): LessonSevenStepId {
  if (checkpointPassed) return 'complete';
  let unlocked: LessonSevenStepId = 'intro';
  for (const [index, step] of lessonSevenStepOrder.entries()) {
    if (step === 'checkpoint' || !completedStepIds.includes(step)) break;
    unlocked = lessonSevenStepOrder[index + 1];
  }
  return unlocked;
}

export function parseLessonSevenProgress(value: unknown): LessonSevenProgress {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return defaultLessonSevenProgress;
  const progress = value as Partial<LessonSevenProgress>;
  const completedAt = typeof progress.completedAt === 'string' && Number.isFinite(Date.parse(progress.completedAt))
    ? new Date(progress.completedAt).toISOString()
    : null;
  const completedStepIds = Array.isArray(progress.completedStepIds)
    ? lessonSevenStepOrder.filter((step) => progress.completedStepIds?.includes(step))
    : [];
  const requestedStep = validStep(progress.currentStepId)
    ? progress.currentStepId
    : completedAt
      ? 'complete'
      : 'intro';
  return normalizeLessonSevenProgress({
    currentStepId: requestedStep,
    completedStepIds,
    checkpointPassed: progress.checkpointPassed === true,
    completedAt,
  });
}

export function normalizeLessonSevenProgress(progress: LessonSevenProgress): LessonSevenProgress {
  const checkpointPassed = progress.checkpointPassed || progress.completedAt !== null;
  const completed = new Set(progress.completedStepIds);
  if (progress.completedAt !== null) {
    completed.add('checkpoint');
    completed.add('complete');
  }
  const completedStepIds = lessonSevenStepOrder.filter((step) => completed.has(step));
  const unlockedRank = lessonSevenStepOrder.indexOf(highestUnlockedStep(completedStepIds, checkpointPassed));
  const requestedRank = lessonSevenStepOrder.indexOf(progress.currentStepId);
  return {
    ...progress,
    currentStepId: lessonSevenStepOrder[Math.min(requestedRank === -1 ? 0 : requestedRank, unlockedRank)] ?? 'intro',
    completedStepIds,
    checkpointPassed,
  };
}
