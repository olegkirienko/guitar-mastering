import type { lessonTenContent } from '@/data/lessons/stage-02-lesson-05/constants';
import type { LessonTwoAudio } from '@/hooks/use-lesson-two-audio/types';

export type GapsLabContent = typeof lessonTenContent.gaps;

export interface GapsLabProps {
  content: GapsLabContent;
  keys: Pick<typeof lessonTenContent, 'keyRowLabel' | 'colors' | 'keyLabel'>;
  audio: LessonTwoAudio;
  gain: number;
  // Called once the pairs are found and the explanation is chosen.
  onSolved: () => void;
}
