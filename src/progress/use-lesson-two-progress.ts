import { lessonTwoProgressAdapter } from '@/progress/lesson-two/lesson-two';
import { type LessonTwoProgress } from '@/progress/lesson-two/types';
import { type LessonProgressController } from '@/progress/use-lesson-progress/types';
import { useLessonProgress } from '@/progress/use-lesson-progress/use-lesson-progress';

export type LessonTwoProgressController = LessonProgressController<LessonTwoProgress>;

export function useLessonTwoProgress(): LessonTwoProgressController {
  return useLessonProgress(lessonTwoProgressAdapter);
}
