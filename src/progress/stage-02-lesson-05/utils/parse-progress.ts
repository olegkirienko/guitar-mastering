import type { LessonTenStepId } from '@/data/lessons/stage-02-lesson-05/types';
import { defaultLessonTenProgress, lessonTenStepOrder } from '@/progress/stage-02-lesson-05/constants';
import type { LessonTenProgress } from '@/progress/stage-02-lesson-05/types';

// The four tasks whose completion stands in for a checkpoint: there is no checkpoint step.
const taskSteps: readonly LessonTenStepId[] = ['octave', 'count', 'gaps', 'walk'];

function validStep(value: unknown): value is LessonTenStepId {
  return typeof value === 'string' && lessonTenStepOrder.includes(value as LessonTenStepId);
}

// Each completed step unlocks the next one in order, `complete` included;
// a finished lesson is open everywhere.
function highestUnlockedStep(completedStepIds: readonly LessonTenStepId[], finished: boolean): LessonTenStepId {
  if (finished) return 'complete';
  let unlocked: LessonTenStepId = 'intro';
  for (const [index, step] of lessonTenStepOrder.entries()) {
    if (!completedStepIds.includes(step)) break;
    unlocked = lessonTenStepOrder[index + 1] ?? step;
  }
  return unlocked;
}

export function parseLessonTenProgress(value: unknown): LessonTenProgress {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return defaultLessonTenProgress;
  const progress = value as Partial<LessonTenProgress>;
  const completedAt = typeof progress.completedAt === 'string' && Number.isFinite(Date.parse(progress.completedAt))
    ? new Date(progress.completedAt).toISOString()
    : null;
  const completedStepIds = Array.isArray(progress.completedStepIds)
    ? lessonTenStepOrder.filter((step) => progress.completedStepIds?.includes(step))
    : [];
  const requestedStep = validStep(progress.currentStepId)
    ? progress.currentStepId
    : completedAt
      ? 'complete'
      : 'intro';
  return normalizeLessonTenProgress({
    currentStepId: requestedStep,
    completedStepIds,
    checkpointPassed: progress.checkpointPassed === true,
    completedAt,
  });
}

export function normalizeLessonTenProgress(progress: LessonTenProgress): LessonTenProgress {
  const completed = new Set(progress.completedStepIds);
  if (progress.completedAt !== null) completed.add('complete');
  const completedStepIds = lessonTenStepOrder.filter((step) => completed.has(step));
  // Derived: true once the four tasks are done, or once the lesson is finished.
  const checkpointPassed = progress.completedAt !== null || taskSteps.every((step) => completed.has(step));
  const unlockedRank = lessonTenStepOrder.indexOf(highestUnlockedStep(completedStepIds, progress.completedAt !== null));
  const requestedRank = lessonTenStepOrder.indexOf(progress.currentStepId);
  return {
    ...progress,
    currentStepId: lessonTenStepOrder[Math.min(requestedRank === -1 ? 0 : requestedRank, unlockedRank)] ?? 'intro',
    completedStepIds,
    checkpointPassed,
  };
}
