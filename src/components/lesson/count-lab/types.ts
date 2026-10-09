import type { lessonTenContent } from '@/data/lessons/stage-02-lesson-05/constants';
import type { LessonTwoAudio } from '@/hooks/use-lesson-two-audio/types';

export type CountLabContent = typeof lessonTenContent.count;

export interface CountLabProps {
  content: CountLabContent;
  keys: Pick<typeof lessonTenContent, 'keyRowLabel' | 'colors' | 'keyLabel'>;
  audio: LessonTwoAudio;
  gain: number;
  // Called once every pair is solved or its answer shown.
  onSolved: () => void;
}
