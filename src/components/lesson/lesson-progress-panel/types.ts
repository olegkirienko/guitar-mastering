import type { LessonProgressController } from '@/progress/use-lesson-progress/types';

export type LessonProgressPanelProps = Pick<LessonProgressController<unknown>, 'sync' | 'retrySync'> & {
  preferencesSaveFailed: boolean;
};
