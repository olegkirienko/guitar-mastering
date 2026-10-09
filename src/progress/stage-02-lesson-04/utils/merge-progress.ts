import type { LessonNineStepId } from '@/data/lessons/stage-02-lesson-04/types';
import type { ProgressValue } from '@/progress/core/types';
import { mergeProgress } from '@/progress/core/utils/merge-progress';
import { lessonNineStepOrder } from '@/progress/stage-02-lesson-04/constants';
import type { LessonNineProgress } from '@/progress/stage-02-lesson-04/types';
import { normalizeLessonNineProgress } from '@/progress/stage-02-lesson-04/utils/parse-progress';

export function toSyncedLessonNineProgress(progress: LessonNineProgress): ProgressValue<LessonNineStepId> {
  return {
    currentStepId: progress.currentStepId,
    completedStepIds: progress.completedStepIds,
    checkpointPassed: progress.checkpointPassed,
    completedAt: progress.completedAt,
  };
}

export function mergeLessonNineProgress(
  local: LessonNineProgress,
  remote: ProgressValue<LessonNineStepId>,
): LessonNineProgress {
  return normalizeLessonNineProgress(mergeProgress(toSyncedLessonNineProgress(local), remote, lessonNineStepOrder));
}

export function lessonNineProgressFingerprint(progress: LessonNineProgress): string {
  return JSON.stringify(toSyncedLessonNineProgress(progress));
}
