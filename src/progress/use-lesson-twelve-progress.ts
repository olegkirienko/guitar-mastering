import { lessonTwelveProgressAdapter } from '@/progress/stage-03-lesson-02/stage-03-lesson-02';
import { type LessonTwelveProgress } from '@/progress/stage-03-lesson-02/types';
import { type LessonProgressController } from '@/progress/use-lesson-progress/types';
import { useLessonProgress } from '@/progress/use-lesson-progress/use-lesson-progress';

export type LessonTwelveProgressController = LessonProgressController<LessonTwelveProgress>;

export function useLessonTwelveProgress(): LessonTwelveProgressController {
  return useLessonProgress(lessonTwelveProgressAdapter);
}
