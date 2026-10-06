import type { LessonFiveStepId } from '@/data/lessons/stage-01-lesson-05/types';
import type { ProgressValue } from '@/progress/core/types';
import { mergeProgress } from '@/progress/core/utils/merge-progress';
import { lessonFiveStepOrder } from '@/progress/lesson-five/constants';
import type { LessonFiveProgress } from '@/progress/lesson-five/types';
import { normalizeLessonFiveProgress } from '@/progress/lesson-five/utils/parse-progress';

export function toSyncedLessonFiveProgress(progress: LessonFiveProgress): ProgressValue<LessonFiveStepId> {
  return {
    currentStepId: progress.currentStepId,
    completedStepIds: progress.completedStepIds,
    checkpointPassed: progress.checkpointPassed,
    completedAt: progress.completedAt,
  };
}

export function mergeLessonFiveProgress(
  local: LessonFiveProgress,
  remote: ProgressValue<LessonFiveStepId>,
): LessonFiveProgress {
  return normalizeLessonFiveProgress(mergeProgress(toSyncedLessonFiveProgress(local), remote, lessonFiveStepOrder));
}

export function lessonFiveProgressFingerprint(progress: LessonFiveProgress): string {
  return JSON.stringify(toSyncedLessonFiveProgress(progress));
}
