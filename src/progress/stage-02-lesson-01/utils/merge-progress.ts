import type { LessonSixStepId } from '@/data/lessons/stage-02-lesson-01/types';
import type { ProgressValue } from '@/progress/core/types';
import { mergeProgress } from '@/progress/core/utils/merge-progress';
import { lessonSixStepOrder } from '@/progress/stage-02-lesson-01/constants';
import type { LessonSixProgress } from '@/progress/stage-02-lesson-01/types';
import { normalizeLessonSixProgress } from '@/progress/stage-02-lesson-01/utils/parse-progress';

export function toSyncedLessonSixProgress(progress: LessonSixProgress): ProgressValue<LessonSixStepId> {
  return {
    currentStepId: progress.currentStepId,
    completedStepIds: progress.completedStepIds,
    checkpointPassed: progress.checkpointPassed,
    completedAt: progress.completedAt,
  };
}

export function mergeLessonSixProgress(
  local: LessonSixProgress,
  remote: ProgressValue<LessonSixStepId>,
): LessonSixProgress {
  return normalizeLessonSixProgress(mergeProgress(toSyncedLessonSixProgress(local), remote, lessonSixStepOrder));
}

export function lessonSixProgressFingerprint(progress: LessonSixProgress): string {
  return JSON.stringify(toSyncedLessonSixProgress(progress));
}
