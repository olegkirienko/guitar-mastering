import type { lessonSixContent } from '@/data/lessons/stage-02-lesson-01/constants';
import type { LessonTwoAudio } from '@/hooks/use-lesson-two-audio/types';

export type OctaveCheckpointContent = typeof lessonSixContent.checkpoint;

export interface OctaveCheckpointProps {
  content: OctaveCheckpointContent;
  audio: LessonTwoAudio;
  gain: number;
  passed: boolean;
  onPass: () => void;
}
