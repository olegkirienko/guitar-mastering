import type { LessonThreeStepId } from '@/data/lessons/stage-01-lesson-03/types';
import type { ProgressValue } from '@/progress/core/types';
import { mergeProgress } from '@/progress/core/utils/merge-progress';
import { lessonThreeStepOrder } from '@/progress/lesson-three/constants';
import type { LessonThreeProgress } from '@/progress/lesson-three/types';
import { normalizeLessonThreeProgress } from '@/progress/lesson-three/utils/parse-progress';

export function toSyncedLessonThreeProgress(progress: LessonThreeProgress): ProgressValue<LessonThreeStepId> {
  return {
    currentStepId: progress.currentStepId,
    completedStepIds: progress.completedStepIds,
    checkpointPassed: progress.checkpointPassed,
    completedAt: progress.completedAt,
  };
}

export function mergeLessonThreeProgress(
  local: LessonThreeProgress,
  remote: ProgressValue<LessonThreeStepId>,
): LessonThreeProgress {
  return normalizeLessonThreeProgress(mergeProgress(toSyncedLessonThreeProgress(local), remote, lessonThreeStepOrder));
}

export function lessonThreeProgressFingerprint(progress: LessonThreeProgress): string {
  return JSON.stringify(toSyncedLessonThreeProgress(progress));
}
