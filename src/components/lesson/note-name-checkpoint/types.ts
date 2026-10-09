import type { ChoiceQuestionChoice } from '@/components/lesson/choice-question/types';

export interface NoteNameTask {
  id: string;
  question: string;
  choices: readonly ChoiceQuestionChoice[];
  correctChoiceId: string;
}

export interface NoteNameCheckpointContent {
  tasks: readonly NoteNameTask[];
  solved: string;
}

export interface NoteNameCheckpointProps {
  content: NoteNameCheckpointContent;
  passed: boolean;
  onPass: () => void;
}
