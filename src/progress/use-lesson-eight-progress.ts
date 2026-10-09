import { lessonEightProgressAdapter } from '@/progress/stage-02-lesson-03/stage-02-lesson-03';
import { type LessonEightProgress } from '@/progress/stage-02-lesson-03/types';
import { type LessonProgressController } from '@/progress/use-lesson-progress/types';
import { useLessonProgress } from '@/progress/use-lesson-progress/use-lesson-progress';

export type LessonEightProgressController = LessonProgressController<LessonEightProgress>;

export function useLessonEightProgress(): LessonEightProgressController {
  return useLessonProgress(lessonEightProgressAdapter);
}
