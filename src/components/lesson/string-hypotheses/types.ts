import type { lessonThreeContent } from '@/data/lessons/stage-01-lesson-03/constants';
import type { HypothesisId } from '@/data/lessons/stage-01-lesson-03/types';

type IntroContent = typeof lessonThreeContent.intro;

export interface StringHypothesesProps {
  content: IntroContent;
  selected: readonly HypothesisId[];
  onToggle: (id: HypothesisId, isSelected: boolean) => void;
  own: string;
  onOwnChange: (value: string) => void;
}
