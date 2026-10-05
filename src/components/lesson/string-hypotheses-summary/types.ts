import type { HypothesesContent } from '@/components/lesson/string-hypotheses/types';

export interface HypothesesSummaryContent<Id extends string> {
  hypothesesTitle: string;
  hypothesesNote: string;
  // The guesses the experiments confirmed; the rest are shown as separate questions.
  confirmedIds: readonly Id[];
  confirmedLabel: string;
  separateLabel: string;
  yourGuessLabel: string;
  verdicts: Readonly<Partial<Record<Id, string>>>;
  ownLabel: string;
  ownVerdict: string;
}

export interface StringHypothesesSummaryProps<Id extends string> {
  intro: Pick<HypothesesContent<Id>, 'hypotheses' | 'ownId'>;
  content: HypothesesSummaryContent<Id>;
  selected: readonly Id[];
  own: string;
}
