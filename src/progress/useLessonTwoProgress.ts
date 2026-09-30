import { lessonTwoProgressAdapter, type LessonTwoProgress } from '@/progress/lesson-two';
import { useLessonProgress, type LessonProgressController } from '@/progress/useLessonProgress';

export type LessonTwoProgressController = LessonProgressController<LessonTwoProgress>;

export function useLessonTwoProgress(): LessonTwoProgressController {
  return useLessonProgress(lessonTwoProgressAdapter);
}
