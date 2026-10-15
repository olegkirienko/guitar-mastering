import type { ChoiceQuestionChoice } from '@/components/lesson/choice-question/types';

export interface StringQuestion {
  id: string;
  question: string;
  choices: readonly ChoiceQuestionChoice[];
  correctChoiceId: string;
}

export interface StringTask {
  id: string;
  title: string;
  questions: readonly StringQuestion[];
}

export interface StringCheckpointContent {
  tasks: readonly StringTask[];
  solvedStatus: (count: number, total: number) => string;
  passed: string;
}

export interface StringCheckpointProps {
  content: StringCheckpointContent;
  passed: boolean;
  onPass: () => void;
}
