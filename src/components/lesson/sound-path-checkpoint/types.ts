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
  // The order the unplaced cards are offered in; a permutation of `cards`, so the
  // already placed first link is filtered out rather than offered.
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

