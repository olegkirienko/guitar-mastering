import type { LessonSixStepId } from '@/data/lessons/stage-02-lesson-01/types';
import { defaultLessonSixProgress, lessonSixStepOrder } from '@/progress/stage-02-lesson-01/constants';
import type { LessonSixProgress } from '@/progress/stage-02-lesson-01/types';

function validStep(value: unknown): value is LessonSixStepId {
  return typeof value === 'string' && lessonSixStepOrder.includes(value as LessonSixStepId);
}

// Each completed step unlocks the next one in order; `complete` unlocks only
// once the checkpoint rules set checkpointPassed.
function highestUnlockedStep(completedStepIds: readonly LessonSixStepId[], checkpointPassed: boolean): LessonSixStepId {
  if (checkpointPassed) return 'complete';
  let unlocked: LessonSixStepId = 'intro';
  for (const [index, step] of lessonSixStepOrder.entries()) {
    if (step === 'checkpoint' || !completedStepIds.includes(step)) break;
    unlocked = lessonSixStepOrder[index + 1];
  }
  return unlocked;
}

export function parseLessonSixProgress(value: unknown): LessonSixProgress {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return defaultLessonSixProgress;
  const progress = value as Partial<LessonSixProgress>;
  const completedAt = typeof progress.completedAt === 'string' && Number.isFinite(Date.parse(progress.completedAt))
    ? new Date(progress.completedAt).toISOString()
    : null;
  const completedStepIds = Array.isArray(progress.completedStepIds)
    ? lessonSixStepOrder.filter((step) => progress.completedStepIds?.includes(step))
    : [];
  const requestedStep = validStep(progress.currentStepId)
    ? progress.currentStepId
    : completedAt
      ? 'complete'
      : 'intro';
  return normalizeLessonSixProgress({
    currentStepId: requestedStep,
    completedStepIds,
    checkpointPassed: progress.checkpointPassed === true,
    completedAt,
  });
}

export function normalizeLessonSixProgress(progress: LessonSixProgress): LessonSixProgress {
  const checkpointPassed = progress.checkpointPassed || progress.completedAt !== null;
  const completed = new Set(progress.completedStepIds);
  if (progress.completedAt !== null) {
    completed.add('checkpoint');
    completed.add('complete');
  }
  const completedStepIds = lessonSixStepOrder.filter((step) => completed.has(step));
  const unlockedRank = lessonSixStepOrder.indexOf(highestUnlockedStep(completedStepIds, checkpointPassed));
  const requestedRank = lessonSixStepOrder.indexOf(progress.currentStepId);
  return {
    ...progress,
    currentStepId: lessonSixStepOrder[Math.min(requestedRank === -1 ? 0 : requestedRank, unlockedRank)] ?? 'intro',
    completedStepIds,
    checkpointPassed,
  };
}
