import { lessonFourProgressAdapter } from '@/progress/lesson-four/lesson-four';
import { type LessonFourProgress } from '@/progress/lesson-four/types';
import { type LessonProgressController } from '@/progress/use-lesson-progress/types';
import { useLessonProgress } from '@/progress/use-lesson-progress/use-lesson-progress';

export type LessonFourProgressController = LessonProgressController<LessonFourProgress>;

export function useLessonFourProgress(): LessonFourProgressController {
  return useLessonProgress(lessonFourProgressAdapter);
}
