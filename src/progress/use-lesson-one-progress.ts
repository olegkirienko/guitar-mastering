import { lessonOneProgressAdapter } from '@/progress/lesson-one/lesson-one';
import { type LessonOneProgress } from '@/progress/lesson-one/types';
import { type LessonProgressController } from '@/progress/use-lesson-progress/types';
import { useLessonProgress } from '@/progress/use-lesson-progress/use-lesson-progress';

export type LessonOneProgressController = LessonProgressController<LessonOneProgress>;

export function useLessonOneProgress(): LessonOneProgressController {
  return useLessonProgress(lessonOneProgressAdapter);
}
