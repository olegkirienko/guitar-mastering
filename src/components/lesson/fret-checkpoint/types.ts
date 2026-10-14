import type { FretBoardContent } from '@/components/lesson/fret-board/types';
import type { ChoiceQuestionChoice } from '@/components/lesson/choice-question/types';
import type { OpenString } from '@/data/lessons/stage-03-lesson-01-model/types';

export type FretTaskId = 'note' | 'find' | 'twelve';

export interface FretCheckpointContent {
  noteTask: { title: string; question: string; choices: readonly ChoiceQuestionChoice[]; correctChoiceId: string };
  findTask: {
    title: string;
    question: string;
    check: string;
    right: (fret: number) => string;
    wrong: (fret: number, note: string) => string;
  };
  twelveTask: { title: string; question: string; choices: readonly ChoiceQuestionChoice[]; correctChoiceId: string };
  solvedStatus: (count: number) => string;
  passed: string;
}

export interface FretCheckpointProps {
  content: FretCheckpointContent;
  board: FretBoardContent;
  openString: OpenString;
  noteFret: number;
  findNote: string;
  describe: (fret: number) => string;
  passed: boolean;
  onPass: () => void;
}
