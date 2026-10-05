import type { LessonFourStepId } from '@/data/lessons/stage-01-lesson-04/types';
import type { ProgressValue } from '@/progress/core/types';
import { mergeProgress } from '@/progress/core/utils/merge-progress';
import { lessonFourStepOrder } from '@/progress/lesson-four/constants';
import type { LessonFourProgress } from '@/progress/lesson-four/types';
import { normalizeLessonFourProgress } from '@/progress/lesson-four/utils/parse-progress';

export function toSyncedLessonFourProgress(progress: LessonFourProgress): ProgressValue<LessonFourStepId> {
  return {
    currentStepId: progress.currentStepId,
    completedStepIds: progress.completedStepIds,
    checkpointPassed: progress.checkpointPassed,
    completedAt: progress.completedAt,
  };
}

export function mergeLessonFourProgress(
  local: LessonFourProgress,
  remote: ProgressValue<LessonFourStepId>,
): LessonFourProgress {
  return normalizeLessonFourProgress(mergeProgress(toSyncedLessonFourProgress(local), remote, lessonFourStepOrder));
}

export function lessonFourProgressFingerprint(progress: LessonFourProgress): string {
  return JSON.stringify(toSyncedLessonFourProgress(progress));
}
