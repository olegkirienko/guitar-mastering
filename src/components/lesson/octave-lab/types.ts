import type { lessonTenContent } from '@/data/lessons/stage-02-lesson-05/constants';
import type { LessonTwoAudio } from '@/hooks/use-lesson-two-audio/types';

export type OctaveLabContent = typeof lessonTenContent.octave;

export interface OctaveLabProps {
  content: OctaveLabContent;
  audio: LessonTwoAudio;
  gain: number;
  // Called once every task is solved or its answer shown.
  onSolved: () => void;
}
