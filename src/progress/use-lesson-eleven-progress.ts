import { lessonElevenProgressAdapter } from '@/progress/stage-03-lesson-01/stage-03-lesson-01';
import { type LessonElevenProgress } from '@/progress/stage-03-lesson-01/types';
import { type LessonProgressController } from '@/progress/use-lesson-progress/types';
import { useLessonProgress } from '@/progress/use-lesson-progress/use-lesson-progress';

export type LessonElevenProgressController = LessonProgressController<LessonElevenProgress>;

export function useLessonElevenProgress(): LessonElevenProgressController {
  return useLessonProgress(lessonElevenProgressAdapter);
}
