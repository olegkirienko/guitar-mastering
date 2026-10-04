import type { LessonOneStepId } from '@/data/lessons/stage-01-lesson-01/types';
import type { ProgressValue } from '@/progress/core/types';
import { mergeProgress } from '@/progress/core/utils/merge-progress';
import { lessonOneStepOrder } from '@/progress/lesson-one/constants';
import type { LessonOneProgress } from '@/progress/lesson-one/types';
import { normalizeLessonOneProgress } from '@/progress/lesson-one/utils/parse-progress';

export function toSyncedLessonOneProgress(progress: LessonOneProgress): ProgressValue<LessonOneStepId> {
  return {
    currentStepId: progress.currentStepId,
    completedStepIds: progress.completedStepIds,
    checkpointPassed: progress.checkpointPassed,
    completedAt: progress.completedAt,
  };
}

export function mergeLessonOneProgress(
  local: LessonOneProgress,
  remote: ProgressValue<LessonOneStepId>,
): LessonOneProgress {
  return normalizeLessonOneProgress(mergeProgress(toSyncedLessonOneProgress(local), remote, lessonOneStepOrder));
}

export function lessonOneProgressFingerprint(progress: LessonOneProgress): string {
  return JSON.stringify(toSyncedLessonOneProgress(progress));
}
