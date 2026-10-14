import type { LessonElevenStepId } from '@/data/lessons/stage-03-lesson-01/types';
import type { ProgressValue } from '@/progress/core/types';
import { mergeProgress } from '@/progress/core/utils/merge-progress';
import { lessonElevenStepOrder } from '@/progress/stage-03-lesson-01/constants';
import type { LessonElevenProgress } from '@/progress/stage-03-lesson-01/types';
import { normalizeLessonElevenProgress } from '@/progress/stage-03-lesson-01/utils/parse-progress';

export function toSyncedLessonElevenProgress(progress: LessonElevenProgress): ProgressValue<LessonElevenStepId> {
  return {
    currentStepId: progress.currentStepId,
    completedStepIds: progress.completedStepIds,
    checkpointPassed: progress.checkpointPassed,
    completedAt: progress.completedAt,
  };
}

export function mergeLessonElevenProgress(
  local: LessonElevenProgress,
  remote: ProgressValue<LessonElevenStepId>,
): LessonElevenProgress {
  return normalizeLessonElevenProgress(mergeProgress(toSyncedLessonElevenProgress(local), remote, lessonElevenStepOrder));
}

export function lessonElevenProgressFingerprint(progress: LessonElevenProgress): string {
  return JSON.stringify(toSyncedLessonElevenProgress(progress));
}
