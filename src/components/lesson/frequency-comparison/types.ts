import { lessonTwoContent } from '@/data/lessons/stage-01-lesson-02/constants';
import type { LessonTwoAudio } from '@/hooks/use-lesson-two-audio/types';

type RepeatsContent = typeof lessonTwoContent.repeats;

export interface FrequencyComparisonProps {
  content: RepeatsContent;
  staticMode: boolean;
  audio: LessonTwoAudio;
  onComplete: () => void;
}
