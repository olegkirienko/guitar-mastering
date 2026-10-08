import { lessonSevenProgressAdapter } from '@/progress/stage-02-lesson-02/stage-02-lesson-02';
import { type LessonSevenProgress } from '@/progress/stage-02-lesson-02/types';
import { type LessonProgressController } from '@/progress/use-lesson-progress/types';
import { useLessonProgress } from '@/progress/use-lesson-progress/use-lesson-progress';

export type LessonSevenProgressController = LessonProgressController<LessonSevenProgress>;

export function useLessonSevenProgress(): LessonSevenProgressController {
  return useLessonProgress(lessonSevenProgressAdapter);
}
