import type { lessonThreeContent } from '@/data/lessons/stage-01-lesson-03/constants';
import type { HypothesisId } from '@/data/lessons/stage-01-lesson-03/types';

type IntroContent = typeof lessonThreeContent.intro;
type CompleteContent = typeof lessonThreeContent.complete;

export interface StringHypothesesSummaryProps {
  intro: IntroContent;
  content: CompleteContent;
  selected: readonly HypothesisId[];
  own: string;
}
