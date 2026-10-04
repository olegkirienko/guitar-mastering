import type { LessonTwoStepId } from '@/data/lessons/stage-01-lesson-02/types';
import type { LessonProgressAdapter } from '@/progress/core/types';
import { defaultLessonTwoProgress, lessonTwoContentVersion, lessonTwoId, lessonTwoSchemaVersion, lessonTwoStepOrder } from '@/progress/lesson-two/constants';
import type { LessonTwoProgress } from '@/progress/lesson-two/types';
import { lessonTwoProgressFingerprint, mergeLessonTwoProgress, toSyncedLessonTwoProgress } from '@/progress/lesson-two/utils/merge-progress';
import { parseLessonTwoProgress } from '@/progress/lesson-two/utils/parse-progress';
import { highestReachableLessonTwoStep, isLessonTwoStepReachable } from '@/progress/lesson-two/utils/step-access';

export const lessonTwoProgressAdapter = {
  lessonId: lessonTwoId,
  schemaVersion: lessonTwoSchemaVersion,
  contentVersion: lessonTwoContentVersion,
  stepOrder: lessonTwoStepOrder,
  defaultProgress: defaultLessonTwoProgress,
  parse: parseLessonTwoProgress,
  toSynced: toSyncedLessonTwoProgress,
  merge: mergeLessonTwoProgress,
  fingerprint: lessonTwoProgressFingerprint,
  isStepReachable: isLessonTwoStepReachable,
  highestReachableStep: highestReachableLessonTwoStep,
} satisfies LessonProgressAdapter<LessonTwoStepId, LessonTwoProgress>;
