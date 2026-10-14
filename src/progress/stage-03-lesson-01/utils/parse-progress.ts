import type { LessonElevenStepId } from '@/data/lessons/stage-03-lesson-01/types';
import { defaultLessonElevenProgress, lessonElevenStepOrder } from '@/progress/stage-03-lesson-01/constants';
import type { LessonElevenProgress } from '@/progress/stage-03-lesson-01/types';

function validStep(value: unknown): value is LessonElevenStepId {
  return typeof value === 'string' && lessonElevenStepOrder.includes(value as LessonElevenStepId);
}

// Each completed step unlocks the next one in order; `complete` unlocks only
// once the checkpoint rules set checkpointPassed.
function highestUnlockedStep(completedStepIds: readonly LessonElevenStepId[], checkpointPassed: boolean): LessonElevenStepId {
  if (checkpointPassed) return 'complete';
  let unlocked: LessonElevenStepId = 'intro';
  for (const [index, step] of lessonElevenStepOrder.entries()) {
    if (step === 'checkpoint' || !completedStepIds.includes(step)) break;
    unlocked = lessonElevenStepOrder[index + 1];
  }
  return unlocked;
}

export function parseLessonElevenProgress(value: unknown): LessonElevenProgress {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return defaultLessonElevenProgress;
  const progress = value as Partial<LessonElevenProgress>;
  const completedAt = typeof progress.completedAt === 'string' && Number.isFinite(Date.parse(progress.completedAt))
    ? new Date(progress.completedAt).toISOString()
    : null;
  const completedStepIds = Array.isArray(progress.completedStepIds)
    ? lessonElevenStepOrder.filter((step) => progress.completedStepIds?.includes(step))
    : [];
  const requestedStep = validStep(progress.currentStepId)
    ? progress.currentStepId
    : completedAt
      ? 'complete'
      : 'intro';
  return normalizeLessonElevenProgress({
    currentStepId: requestedStep,
    completedStepIds,
    checkpointPassed: progress.checkpointPassed === true,
    completedAt,
  });
}

export function normalizeLessonElevenProgress(progress: LessonElevenProgress): LessonElevenProgress {
  const checkpointPassed = progress.checkpointPassed || progress.completedAt !== null;
  const completed = new Set(progress.completedStepIds);
  if (progress.completedAt !== null) {
    completed.add('checkpoint');
    completed.add('complete');
  }
  const completedStepIds = lessonElevenStepOrder.filter((step) => completed.has(step));
  const unlockedRank = lessonElevenStepOrder.indexOf(highestUnlockedStep(completedStepIds, checkpointPassed));
  const requestedRank = lessonElevenStepOrder.indexOf(progress.currentStepId);
  return {
    ...progress,
    currentStepId: lessonElevenStepOrder[Math.min(requestedRank === -1 ? 0 : requestedRank, unlockedRank)] ?? 'intro',
    completedStepIds,
    checkpointPassed,
  };
}
