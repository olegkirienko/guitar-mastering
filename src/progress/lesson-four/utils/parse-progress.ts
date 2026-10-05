import type { LessonFourStepId } from '@/data/lessons/stage-01-lesson-04/types';
import { defaultLessonFourProgress, lessonFourStepOrder } from '@/progress/lesson-four/constants';
import type { LessonFourProgress } from '@/progress/lesson-four/types';

function validStep(value: unknown): value is LessonFourStepId {
  return typeof value === 'string' && lessonFourStepOrder.includes(value as LessonFourStepId);
}

// Each completed step unlocks the next one in order; `complete` unlocks only
// once the checkpoint rules set checkpointPassed.
function highestUnlockedStep(completedStepIds: readonly LessonFourStepId[], checkpointPassed: boolean): LessonFourStepId {
  if (checkpointPassed) return 'complete';
  let unlocked: LessonFourStepId = 'intro';
  for (const [index, step] of lessonFourStepOrder.entries()) {
    if (step === 'checkpoint' || !completedStepIds.includes(step)) break;
    unlocked = lessonFourStepOrder[index + 1];
  }
  return unlocked;
}

export function parseLessonFourProgress(value: unknown): LessonFourProgress {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return defaultLessonFourProgress;
  const progress = value as Partial<LessonFourProgress>;
  const completedAt = typeof progress.completedAt === 'string' && Number.isFinite(Date.parse(progress.completedAt))
    ? new Date(progress.completedAt).toISOString()
    : null;
  const completedStepIds = Array.isArray(progress.completedStepIds)
    ? lessonFourStepOrder.filter((step) => progress.completedStepIds?.includes(step))
    : [];
  const requestedStep = validStep(progress.currentStepId)
    ? progress.currentStepId
    : completedAt
      ? 'complete'
      : 'intro';
  return normalizeLessonFourProgress({
    currentStepId: requestedStep,
    completedStepIds,
    checkpointPassed: progress.checkpointPassed === true,
    completedAt,
  });
}

export function normalizeLessonFourProgress(progress: LessonFourProgress): LessonFourProgress {
  const checkpointPassed = progress.checkpointPassed || progress.completedAt !== null;
  const completed = new Set(progress.completedStepIds);
  if (progress.completedAt !== null) {
    completed.add('checkpoint');
    completed.add('complete');
  }
  const completedStepIds = lessonFourStepOrder.filter((step) => completed.has(step));
  const unlockedRank = lessonFourStepOrder.indexOf(highestUnlockedStep(completedStepIds, checkpointPassed));
  const requestedRank = lessonFourStepOrder.indexOf(progress.currentStepId);
  return {
    ...progress,
    currentStepId: lessonFourStepOrder[Math.min(requestedRank === -1 ? 0 : requestedRank, unlockedRank)] ?? 'intro',
    completedStepIds,
    checkpointPassed,
  };
}
