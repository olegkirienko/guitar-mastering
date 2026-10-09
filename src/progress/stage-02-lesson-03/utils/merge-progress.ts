import type { LessonEightStepId } from '@/data/lessons/stage-02-lesson-03/types';
import type { ProgressValue } from '@/progress/core/types';
import { mergeProgress } from '@/progress/core/utils/merge-progress';
import { lessonEightStepOrder } from '@/progress/stage-02-lesson-03/constants';
import type { LessonEightProgress } from '@/progress/stage-02-lesson-03/types';
import { normalizeLessonEightProgress } from '@/progress/stage-02-lesson-03/utils/parse-progress';

export function toSyncedLessonEightProgress(progress: LessonEightProgress): ProgressValue<LessonEightStepId> {
  return {
    currentStepId: progress.currentStepId,
    completedStepIds: progress.completedStepIds,
    checkpointPassed: progress.checkpointPassed,
    completedAt: progress.completedAt,
  };
}

export function mergeLessonEightProgress(
  local: LessonEightProgress,
  remote: ProgressValue<LessonEightStepId>,
): LessonEightProgress {
  return normalizeLessonEightProgress(mergeProgress(toSyncedLessonEightProgress(local), remote, lessonEightStepOrder));
}

export function lessonEightProgressFingerprint(progress: LessonEightProgress): string {
  return JSON.stringify(toSyncedLessonEightProgress(progress));
}
