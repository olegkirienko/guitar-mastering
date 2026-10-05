import { lessonThreeProgressAdapter } from '@/progress/lesson-three/lesson-three';
import { type LessonThreeProgress } from '@/progress/lesson-three/types';
import { type LessonProgressController } from '@/progress/use-lesson-progress/types';
import { useLessonProgress } from '@/progress/use-lesson-progress/use-lesson-progress';

export type LessonThreeProgressController = LessonProgressController<LessonThreeProgress>;

export function useLessonThreeProgress(): LessonThreeProgressController {
  return useLessonProgress(lessonThreeProgressAdapter);
}
