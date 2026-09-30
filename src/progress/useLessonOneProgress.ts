import { lessonOneProgressAdapter, type LessonOneProgress } from '@/progress/lesson-one';
import { useLessonProgress, type LessonProgressController } from '@/progress/useLessonProgress';

export type LessonOneProgressController = LessonProgressController<LessonOneProgress>;

export function useLessonOneProgress(): LessonOneProgressController {
  return useLessonProgress(lessonOneProgressAdapter);
}
