import type { LessonFiveStepId } from '@/data/lessons/stage-01-lesson-05/types';
import { defaultLessonFiveProgress, lessonFiveCheckpointSteps, lessonFiveStepOrder } from '@/progress/lesson-five/constants';
import type { LessonFiveProgress } from '@/progress/lesson-five/types';

function validStep(value: unknown): value is LessonFiveStepId {
  return typeof value === 'string' && lessonFiveStepOrder.includes(value as LessonFiveStepId);
}

// Each completed step unlocks the next one in order. There is no separate checkpoint
// step here, so `complete` opens from the sequence like every other step.
function highestUnlockedStep(completedStepIds: readonly LessonFiveStepId[]): LessonFiveStepId {
  let unlocked: LessonFiveStepId = 'intro';
  for (const [index, step] of lessonFiveStepOrder.entries()) {
    if (!completedStepIds.includes(step)) break;
    unlocked = lessonFiveStepOrder[index + 1] ?? step;
  }
  return unlocked;
}

// The whole lesson is the check of Stage I: the four task screens together are what the
// other lessons save as a `checkpoint` step, so the flag is derived, never stored.
function checkpointPassedFrom(completedStepIds: readonly LessonFiveStepId[], completedAt: string | null): boolean {
  return completedAt !== null || lessonFiveCheckpointSteps.every((step) => completedStepIds.includes(step));
}

export function parseLessonFiveProgress(value: unknown): LessonFiveProgress {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return defaultLessonFiveProgress;
  const progress = value as Partial<LessonFiveProgress>;
  const completedAt = typeof progress.completedAt === 'string' && Number.isFinite(Date.parse(progress.completedAt))
    ? new Date(progress.completedAt).toISOString()
    : null;
  const completedStepIds = Array.isArray(progress.completedStepIds)
    ? lessonFiveStepOrder.filter((step) => progress.completedStepIds?.includes(step))
    : [];
  const requestedStep = validStep(progress.currentStepId)
    ? progress.currentStepId
    : completedAt
      ? 'complete'
      : 'intro';
  return normalizeLessonFiveProgress({
    currentStepId: requestedStep,
    completedStepIds,
    checkpointPassed: progress.checkpointPassed === true,
    completedAt,
  });
}

export function normalizeLessonFiveProgress(progress: LessonFiveProgress): LessonFiveProgress {
  const completed = new Set(progress.completedStepIds);
  if (progress.completedAt !== null) completed.add('complete');
  const completedStepIds = lessonFiveStepOrder.filter((step) => completed.has(step));
  const unlockedRank = lessonFiveStepOrder.indexOf(highestUnlockedStep(completedStepIds));
  const requestedRank = lessonFiveStepOrder.indexOf(progress.currentStepId);
  return {
    ...progress,
    currentStepId: lessonFiveStepOrder[Math.min(requestedRank === -1 ? 0 : requestedRank, unlockedRank)] ?? 'intro',
    completedStepIds,
    checkpointPassed: checkpointPassedFrom(completedStepIds, progress.completedAt),
  };
}
