import type { lessonSevenContent } from '@/data/lessons/stage-02-lesson-02/constants';

export type MultiplyChainContent = typeof lessonSevenContent.deeper;

export interface MultiplyChainProps {
  content: MultiplyChainContent;
  count: number;
  onMultiply: () => void;
  onReset: () => void;
}
