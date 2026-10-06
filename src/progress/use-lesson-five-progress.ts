import { lessonFiveProgressAdapter } from '@/progress/lesson-five/lesson-five';
import { type LessonFiveProgress } from '@/progress/lesson-five/types';
import { type LessonProgressController } from '@/progress/use-lesson-progress/types';
import { useLessonProgress } from '@/progress/use-lesson-progress/use-lesson-progress';

export type LessonFiveProgressController = LessonProgressController<LessonFiveProgress>;

export function useLessonFiveProgress(): LessonFiveProgressController {
  return useLessonProgress(lessonFiveProgressAdapter);
}
