import { lessonTwoContent } from '@/data/lessons/stage-01-lesson-02/constants';

type CheckpointContent = typeof lessonTwoContent.checkpoint;

export interface FrequencyPitchCheckpointProps {
  content: CheckpointContent;
  passed: boolean;
  onPass: () => void;
}
