import type { ChoiceQuestionChoice } from '@/components/lesson/choice-question/types';

export interface AccidentalNamesTask {
  question: string;
  highlightKey: number;
  options: readonly string[];
  // All of these have to be picked, and nothing else.
  correct: readonly string[];
  checkLabel: string;
  right: string;
  wrong: string;
}

export interface AccidentalFindTask {
  question: string;
  targetKey: number;
  right: string;
  wrong: (key: number) => string;
}

export interface AccidentalPairsTask {
  question: string;
  items: readonly { first: string; second: string; same: boolean; explanation: string }[];
  sameLabel: string;
  differentLabel: string;
  right: string;
  wrong: string;
}

export interface AccidentalCheckpointContent {
  names: AccidentalNamesTask;
  find: AccidentalFindTask;
  pairs: AccidentalPairsTask;
  natural: { question: string; choices: readonly ChoiceQuestionChoice[]; correctChoiceId: string };
  solved: string;
}

export interface AccidentalCheckpointKeys {
  label: string;
  base: number;
  keyLabel: (key: number, frequency: string) => string;
  onPlay: (key: number) => void;
}

export interface AccidentalCheckpointProps {
  content: AccidentalCheckpointContent;
  keys: AccidentalCheckpointKeys;
  passed: boolean;
  onPass: () => void;
}

export type TaskId = 'names' | 'find' | 'pairs' | 'natural';

export type Verdict = 'right' | 'wrong' | null;
