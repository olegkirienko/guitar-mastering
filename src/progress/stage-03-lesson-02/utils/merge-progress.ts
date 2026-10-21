import type { LessonTwelveStepId } from '@/data/lessons/stage-03-lesson-02/types';
import type { ProgressValue } from '@/progress/core/types';
import { mergeProgress } from '@/progress/core/utils/merge-progress';
import { lessonTwelveStepOrder } from '@/progress/stage-03-lesson-02/constants';
import type { LessonTwelveProgress } from '@/progress/stage-03-lesson-02/types';
import { normalizeLessonTwelveProgress } from '@/progress/stage-03-lesson-02/utils/parse-progress';

export function toSyncedLessonTwelveProgress(progress: LessonTwelveProgress): ProgressValue<LessonTwelveStepId> {
  return {
    currentStepId: progress.currentStepId,
    completedStepIds: progress.completedStepIds,
    checkpointPassed: progress.checkpointPassed,
    completedAt: progress.completedAt,
  };
}

export function mergeLessonTwelveProgress(
  local: LessonTwelveProgress,
  remote: ProgressValue<LessonTwelveStepId>,
): LessonTwelveProgress {
  return normalizeLessonTwelveProgress(mergeProgress(toSyncedLessonTwelveProgress(local), remote, lessonTwelveStepOrder));
}

export function lessonTwelveProgressFingerprint(progress: LessonTwelveProgress): string {
  return JSON.stringify(toSyncedLessonTwelveProgress(progress));
}
