import { lessonSixProgressAdapter } from '@/progress/stage-02-lesson-01/stage-02-lesson-01';
import { type LessonSixProgress } from '@/progress/stage-02-lesson-01/types';
import { type LessonProgressController } from '@/progress/use-lesson-progress/types';
import { useLessonProgress } from '@/progress/use-lesson-progress/use-lesson-progress';

export type LessonSixProgressController = LessonProgressController<LessonSixProgress>;

export function useLessonSixProgress(): LessonSixProgressController {
  return useLessonProgress(lessonSixProgressAdapter);
}
