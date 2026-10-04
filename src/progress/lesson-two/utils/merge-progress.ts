import type { LessonTwoStepId } from '@/data/lessons/stage-01-lesson-02/types';
import type { ProgressValue } from '@/progress/core/types';
import { mergeProgress } from '@/progress/core/utils/merge-progress';
import { lessonTwoStepOrder } from '@/progress/lesson-two/constants';
import type { LessonTwoProgress } from '@/progress/lesson-two/types';
import { normalizeLessonTwoProgress } from '@/progress/lesson-two/utils/parse-progress';

export function toSyncedLessonTwoProgress(progress: LessonTwoProgress): ProgressValue<LessonTwoStepId> {
  return {
    currentStepId: progress.currentStepId,
    completedStepIds: progress.completedStepIds,
    checkpointPassed: progress.checkpointPassed,
    completedAt: progress.completedAt,
  };
}

export function mergeLessonTwoProgress(
  local: LessonTwoProgress,
  remote: ProgressValue<LessonTwoStepId>,
): LessonTwoProgress {
  return normalizeLessonTwoProgress(mergeProgress(toSyncedLessonTwoProgress(local), remote, lessonTwoStepOrder));
}

export function lessonTwoProgressFingerprint(progress: LessonTwoProgress): string {
  return JSON.stringify(toSyncedLessonTwoProgress(progress));
}
