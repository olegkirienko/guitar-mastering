import type { lessonSevenContent } from '@/data/lessons/stage-02-lesson-02/constants';
import type { LessonTwoAudio } from '@/hooks/use-lesson-two-audio/types';

export type StepWalkContent = typeof lessonSevenContent.steps;

export type StepWalkAnswer = 'none' | 'right' | 'wrong' | 'revealed';

export interface StepWalkProps {
  content: StepWalkContent;
  keyRowLabel: string;
  keyLabel: (key: number, frequency: string) => string;
  audio: LessonTwoAudio;
  gain: number;
  onDone: () => void;
}
