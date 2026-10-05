import type { ChoiceQuestionChoice } from '@/components/lesson/choice-question/types';
import type { StringFactor } from '@/data/lessons/stage-01-lesson-03-model/types';
import type { LessonTwoAudio } from '@/hooks/use-lesson-two-audio/types';

export interface FactorPrediction {
  question: string;
  choices: readonly ChoiceQuestionChoice[];
  correctChoiceId: string;
}

export interface FactorExperimentContent {
  title: string;
  note: string;
  factorLabels: Readonly<Record<StringFactor, string>>;
  lockedNote: string;
  pluckLabel: string;
  frequencyLabel: string;
  trackNote: string;
  more: string;
  less: string;
  same: string;
  notTried: string;
  tableCaption: string;
  levelHeader: string;
  frequencyHeader: string;
  tryMore: string;
  naming: { before: string; term: string; after: string; rule: string };
  application: string;
}

export interface StringFactorExperimentProps {
  factor: StringFactor;
  prediction: FactorPrediction;
  content: FactorExperimentContent;
  audio: LessonTwoAudio;
  completed: boolean;
  onComplete: () => void;
}
