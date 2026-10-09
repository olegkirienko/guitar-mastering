import { lessonTenProgressAdapter } from '@/progress/stage-02-lesson-05/stage-02-lesson-05';
import { type LessonTenProgress } from '@/progress/stage-02-lesson-05/types';
import { type LessonProgressController } from '@/progress/use-lesson-progress/types';
import { useLessonProgress } from '@/progress/use-lesson-progress/use-lesson-progress';

export type LessonTenProgressController = LessonProgressController<LessonTenProgress>;

export function useLessonTenProgress(): LessonTenProgressController {
  return useLessonProgress(lessonTenProgressAdapter);
}
