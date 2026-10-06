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
  // Which control choice passes the checkpoint, and the line that says it is passed:
  // every lesson that rebuilds the path names its own.
  correctChoiceId: string;
  passed: string;
  summary: string;
  application: string;
}

export interface SoundPathCheckpointProps {
  content: SoundPathCheckpointContent;
  initiallyPassed: boolean;
  onComplete: () => void;
}

export type SequenceResult = 'idle' | 'incorrect' | 'correct' | 'explained';
