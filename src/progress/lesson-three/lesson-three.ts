import type { LessonThreeStepId } from '@/data/lessons/stage-01-lesson-03/types';
import type { LessonProgressAdapter } from '@/progress/core/types';
import { defaultLessonThreeProgress, lessonThreeContentVersion, lessonThreeId, lessonThreeSchemaVersion, lessonThreeStepOrder } from '@/progress/lesson-three/constants';
import type { LessonThreeProgress } from '@/progress/lesson-three/types';
import { lessonThreeProgressFingerprint, mergeLessonThreeProgress, toSyncedLessonThreeProgress } from '@/progress/lesson-three/utils/merge-progress';
import { parseLessonThreeProgress } from '@/progress/lesson-three/utils/parse-progress';
import { highestReachableLessonThreeStep, isLessonThreeStepReachable } from '@/progress/lesson-three/utils/step-access';

export const lessonThreeProgressAdapter = {
  lessonId: lessonThreeId,
  schemaVersion: lessonThreeSchemaVersion,
  contentVersion: lessonThreeContentVersion,
  stepOrder: lessonThreeStepOrder,
  defaultProgress: defaultLessonThreeProgress,
  parse: parseLessonThreeProgress,
  toSynced: toSyncedLessonThreeProgress,
  merge: mergeLessonThreeProgress,
  fingerprint: lessonThreeProgressFingerprint,
  isStepReachable: isLessonThreeStepReachable,
  highestReachableStep: highestReachableLessonThreeStep,
} satisfies LessonProgressAdapter<LessonThreeStepId, LessonThreeProgress>;
