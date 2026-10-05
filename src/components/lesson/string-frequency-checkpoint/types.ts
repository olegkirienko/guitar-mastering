import type { StringFrequencyLabContent } from '@/components/lesson/string-frequency-lab/types';
import type { lessonThreeContent } from '@/data/lessons/stage-01-lesson-03/constants';
import type { LessonTwoAudio } from '@/hooks/use-lesson-two-audio/types';

type CheckpointContent = typeof lessonThreeContent.checkpoint;

export interface StringFrequencyCheckpointProps {
  content: CheckpointContent;
  lab: StringFrequencyLabContent;
  audio: LessonTwoAudio;
  passed: boolean;
  onPass: () => void;
}
