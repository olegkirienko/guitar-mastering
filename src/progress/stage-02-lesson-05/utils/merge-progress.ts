import type { LessonTenStepId } from '@/data/lessons/stage-02-lesson-05/types';
import type { ProgressValue } from '@/progress/core/types';
import { mergeProgress } from '@/progress/core/utils/merge-progress';
import { lessonTenStepOrder } from '@/progress/stage-02-lesson-05/constants';
import type { LessonTenProgress } from '@/progress/stage-02-lesson-05/types';
import { normalizeLessonTenProgress } from '@/progress/stage-02-lesson-05/utils/parse-progress';

export function toSyncedLessonTenProgress(progress: LessonTenProgress): ProgressValue<LessonTenStepId> {
  return {
    currentStepId: progress.currentStepId,
    completedStepIds: progress.completedStepIds,
    checkpointPassed: progress.checkpointPassed,
    completedAt: progress.completedAt,
  };
}

export function mergeLessonTenProgress(
  local: LessonTenProgress,
  remote: ProgressValue<LessonTenStepId>,
): LessonTenProgress {
  return normalizeLessonTenProgress(mergeProgress(toSyncedLessonTenProgress(local), remote, lessonTenStepOrder));
}

export function lessonTenProgressFingerprint(progress: LessonTenProgress): string {
  return JSON.stringify(toSyncedLessonTenProgress(progress));
}
