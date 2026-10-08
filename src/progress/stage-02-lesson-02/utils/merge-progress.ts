import type { LessonSevenStepId } from '@/data/lessons/stage-02-lesson-02/types';
import type { ProgressValue } from '@/progress/core/types';
import { mergeProgress } from '@/progress/core/utils/merge-progress';
import { lessonSevenStepOrder } from '@/progress/stage-02-lesson-02/constants';
import type { LessonSevenProgress } from '@/progress/stage-02-lesson-02/types';
import { normalizeLessonSevenProgress } from '@/progress/stage-02-lesson-02/utils/parse-progress';

export function toSyncedLessonSevenProgress(progress: LessonSevenProgress): ProgressValue<LessonSevenStepId> {
  return {
    currentStepId: progress.currentStepId,
    completedStepIds: progress.completedStepIds,
    checkpointPassed: progress.checkpointPassed,
    completedAt: progress.completedAt,
  };
}

export function mergeLessonSevenProgress(
  local: LessonSevenProgress,
  remote: ProgressValue<LessonSevenStepId>,
): LessonSevenProgress {
  return normalizeLessonSevenProgress(mergeProgress(toSyncedLessonSevenProgress(local), remote, lessonSevenStepOrder));
}

export function lessonSevenProgressFingerprint(progress: LessonSevenProgress): string {
  return JSON.stringify(toSyncedLessonSevenProgress(progress));
}
