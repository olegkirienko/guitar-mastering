import type { lessonSevenContent } from '@/data/lessons/stage-02-lesson-02/constants';

export type SemitoneCheckpointContent = typeof lessonSevenContent.checkpoint;

export interface SemitoneCheckpointProps {
  content: SemitoneCheckpointContent;
  passed: boolean;
  onPass: () => void;
}

export type TaskId = 'distance' | 'after' | 'return';
