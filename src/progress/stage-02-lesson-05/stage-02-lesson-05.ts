import type { LessonTenStepId } from '@/data/lessons/stage-02-lesson-05/types';
import type { LessonProgressAdapter } from '@/progress/core/types';
import { defaultLessonTenProgress, lessonTenContentVersion, lessonTenId, lessonTenSchemaVersion, lessonTenStepOrder } from '@/progress/stage-02-lesson-05/constants';
import type { LessonTenProgress } from '@/progress/stage-02-lesson-05/types';
import { lessonTenProgressFingerprint, mergeLessonTenProgress, toSyncedLessonTenProgress } from '@/progress/stage-02-lesson-05/utils/merge-progress';
import { parseLessonTenProgress } from '@/progress/stage-02-lesson-05/utils/parse-progress';
import { highestReachableLessonTenStep, isLessonTenStepReachable } from '@/progress/stage-02-lesson-05/utils/step-access';

export const lessonTenProgressAdapter = {
  lessonId: lessonTenId,
  schemaVersion: lessonTenSchemaVersion,
  contentVersion: lessonTenContentVersion,
  stepOrder: lessonTenStepOrder,
  defaultProgress: defaultLessonTenProgress,
  parse: parseLessonTenProgress,
  toSynced: toSyncedLessonTenProgress,
  merge: mergeLessonTenProgress,
  fingerprint: lessonTenProgressFingerprint,
  isStepReachable: isLessonTenStepReachable,
  highestReachableStep: highestReachableLessonTenStep,
} satisfies LessonProgressAdapter<LessonTenStepId, LessonTenProgress>;
