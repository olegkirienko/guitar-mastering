import type { LessonEightStepId } from '@/data/lessons/stage-02-lesson-03/types';
import type { LessonProgressAdapter } from '@/progress/core/types';
import { defaultLessonEightProgress, lessonEightContentVersion, lessonEightId, lessonEightSchemaVersion, lessonEightStepOrder } from '@/progress/stage-02-lesson-03/constants';
import type { LessonEightProgress } from '@/progress/stage-02-lesson-03/types';
import { lessonEightProgressFingerprint, mergeLessonEightProgress, toSyncedLessonEightProgress } from '@/progress/stage-02-lesson-03/utils/merge-progress';
import { parseLessonEightProgress } from '@/progress/stage-02-lesson-03/utils/parse-progress';
import { highestReachableLessonEightStep, isLessonEightStepReachable } from '@/progress/stage-02-lesson-03/utils/step-access';

export const lessonEightProgressAdapter = {
  lessonId: lessonEightId,
  schemaVersion: lessonEightSchemaVersion,
  contentVersion: lessonEightContentVersion,
  stepOrder: lessonEightStepOrder,
  defaultProgress: defaultLessonEightProgress,
  parse: parseLessonEightProgress,
  toSynced: toSyncedLessonEightProgress,
  merge: mergeLessonEightProgress,
  fingerprint: lessonEightProgressFingerprint,
  isStepReachable: isLessonEightStepReachable,
  highestReachableStep: highestReachableLessonEightStep,
} satisfies LessonProgressAdapter<LessonEightStepId, LessonEightProgress>;
