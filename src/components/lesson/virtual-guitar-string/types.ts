import type { ChoiceQuestionChoice } from '@/components/lesson/choice-question/types';

export type StringState = 'rest' | 'playing' | 'paused' | 'stopped';

export type AudioStatus = 'idle' | 'ready' | 'blocked' | 'unavailable';

export interface VirtualGuitarStringProps {
  observationChoices: readonly ChoiceQuestionChoice[];
  predictionChoices: readonly ChoiceQuestionChoice[];
  audioEnabled: boolean;
  staticMode: boolean;
  onAudioEnabledChange: (enabled: boolean) => void;
  onExperimentComplete: () => void;
}
