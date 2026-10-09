import type { lessonTenContent } from '@/data/lessons/stage-02-lesson-05/constants';
import type { LessonTwoAudio } from '@/hooks/use-lesson-two-audio/types';

export type SemitoneWalkLabContent = typeof lessonTenContent.walk;

export interface SemitoneWalkLabProps {
  content: SemitoneWalkLabContent;
  keys: Pick<typeof lessonTenContent, 'keyRowLabel' | 'colors' | 'keyLabel'>;
  audio: LessonTwoAudio;
  gain: number;
  // The learner's answer from `intro`, shown beside the result, never graded.
  predictionLabel: string | null;
  // Called once all 12 steps are named and the sentence is chosen.
  onSolved: () => void;
}
