import type { LessonElevenStepId } from '@/data/lessons/stage-03-lesson-01/types';
import type { LessonProgressAdapter } from '@/progress/core/types';
import { defaultLessonElevenProgress, lessonElevenContentVersion, lessonElevenId, lessonElevenSchemaVersion, lessonElevenStepOrder } from '@/progress/stage-03-lesson-01/constants';
import type { LessonElevenProgress } from '@/progress/stage-03-lesson-01/types';
import { lessonElevenProgressFingerprint, mergeLessonElevenProgress, toSyncedLessonElevenProgress } from '@/progress/stage-03-lesson-01/utils/merge-progress';
import { parseLessonElevenProgress } from '@/progress/stage-03-lesson-01/utils/parse-progress';
import { highestReachableLessonElevenStep, isLessonElevenStepReachable } from '@/progress/stage-03-lesson-01/utils/step-access';

export const lessonElevenProgressAdapter = {
  lessonId: lessonElevenId,
  schemaVersion: lessonElevenSchemaVersion,
  contentVersion: lessonElevenContentVersion,
  stepOrder: lessonElevenStepOrder,
  defaultProgress: defaultLessonElevenProgress,
  parse: parseLessonElevenProgress,
  toSynced: toSyncedLessonElevenProgress,
  merge: mergeLessonElevenProgress,
  fingerprint: lessonElevenProgressFingerprint,
  isStepReachable: isLessonElevenStepReachable,
  highestReachableStep: highestReachableLessonElevenStep,
} satisfies LessonProgressAdapter<LessonElevenStepId, LessonElevenProgress>;
