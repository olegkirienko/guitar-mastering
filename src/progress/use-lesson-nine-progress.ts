import { lessonNineProgressAdapter } from '@/progress/stage-02-lesson-04/stage-02-lesson-04';
import { type LessonNineProgress } from '@/progress/stage-02-lesson-04/types';
import { type LessonProgressController } from '@/progress/use-lesson-progress/types';
import { useLessonProgress } from '@/progress/use-lesson-progress/use-lesson-progress';

export type LessonNineProgressController = LessonProgressController<LessonNineProgress>;

export function useLessonNineProgress(): LessonNineProgressController {
  return useLessonProgress(lessonNineProgressAdapter);
}
