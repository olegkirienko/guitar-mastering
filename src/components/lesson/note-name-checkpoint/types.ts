import type { ChoiceQuestionChoice } from '@/components/lesson/choice-question/types';

export interface NoteNameTask {
  id: string;
  question: string;
  choices: readonly ChoiceQuestionChoice[];
  correctChoiceId: string;
  // A white key shown on the keyboard above the question, without its letter.
  highlightKey?: number;
}

export interface NoteNameCheckpointContent {
  tasks: readonly NoteNameTask[];
  solved: string;
}

export interface NoteNameCheckpointKeys {
  label: string;
  base: number;
  keyLabel: (key: number, frequency: string) => string;
  onPlay: (key: number) => void;
}

export interface NoteNameCheckpointProps {
  content: NoteNameCheckpointContent;
  keys: NoteNameCheckpointKeys;
  passed: boolean;
  onPass: () => void;
}
