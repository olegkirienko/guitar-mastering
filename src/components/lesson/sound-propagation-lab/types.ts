import type { ChoiceQuestionChoice } from '@/components/lesson/choice-question/types';

export interface SoundPropagationLabContent {
  predictionQuestion: string;
  predictionChoices: readonly ChoiceQuestionChoice[];
  observationQuestion: string;
  observationChoices: readonly ChoiceQuestionChoice[];
  staticFrames: readonly { title: string; description: string }[];
  reveal: string;
}

export interface SoundPropagationLabProps {
  content: SoundPropagationLabContent;
  staticMode: boolean;
  onComplete: () => void;
}

export type PlaybackState = 'idle' | 'playing' | 'paused' | 'finished';
