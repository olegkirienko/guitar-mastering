interface CheckpointCard {
  id: string;
  label: string;
  illustration: string;
}

interface CheckpointChoice {
  id: string;
  label: string;
  feedback: string;
}

interface SoundPathCheckpointContent {
  question: string;
  cards: readonly CheckpointCard[];
  initialOrder: readonly string[];
  breakHints: readonly string[];
  controlQuestion: string;
  controlChoices: readonly CheckpointChoice[];
  summary: string;
  application: string;
}

export interface SoundPathCheckpointProps {
  content: SoundPathCheckpointContent;
  initiallyPassed: boolean;
  onComplete: () => void;
}

export type SequenceResult = 'idle' | 'incorrect' | 'correct' | 'explained';
