import type { lessonSevenContent } from '@/data/lessons/stage-02-lesson-02/constants';

export type StepTableContent = typeof lessonSevenContent.compare.table;

export interface StepTableProps {
  content: StepTableContent;
  base: number;
}
