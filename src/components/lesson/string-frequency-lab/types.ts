import type { ChoiceQuestionChoice } from '@/components/lesson/choice-question/types';
import type { CheckpointTask, StringFactor, StringSettings } from '@/data/lessons/stage-01-lesson-03-model/types';
import type { LessonTwoAudio } from '@/hooks/use-lesson-two-audio/types';

// A combination guessed before the change; `target` is the state that tests it.
export interface LabPrediction {
  id: string;
  question: string;
  choices: readonly ChoiceQuestionChoice[];
  correctChoiceId: string;
  target: StringSettings;
  setupHint: string;
  checked: string;
}

export interface StringFrequencyLabContent {
  title: string;
  note: string;
  predictionsTitle: string;
  factorLabels: Readonly<Record<StringFactor, string>>;
  resetLabel: string;
  resetText: string;
  pluckLabel: string;
  frequencyLabel: string;
  trackNote: string;
  more: string;
  less: string;
  same: string;
  rulesTitle: string;
  rules: Readonly<Record<StringFactor, string>>;
  lastChangedLabel: string;
  doneText: string;
}

// Task mode: start state, one locked factor, and a check with a rule-based hint.
export interface LabTask {
  model: CheckpointTask;
  title: string;
  goal: string;
  sameHint: string;
  wrongHint: string;
  solved: string;
  lockedNote: string;
  checkLabel: string;
  resetLabel: string;
  startText: string;
}

export interface StringFrequencyLabProps {
  content: StringFrequencyLabContent;
  predictions?: readonly LabPrediction[];
  task?: LabTask;
  audio: LessonTwoAudio;
  completed: boolean;
  onComplete: () => void;
}
