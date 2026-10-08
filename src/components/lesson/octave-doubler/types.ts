import type { lessonSixContent } from '@/data/lessons/stage-02-lesson-01/constants';
import type { LessonTwoAudio } from '@/hooks/use-lesson-two-audio/types';

export type OctaveDoublerContent = typeof lessonSixContent.doubler;

export type PredictionId = OctaveDoublerContent['prediction']['choices'][number]['id'];

export interface OctaveDoublerProps {
  content: OctaveDoublerContent;
  audio: LessonTwoAudio;
  gain: number;
  // True once the learner has already finished this screen in an earlier visit.
  completed: boolean;
  onDone: () => void;
}
