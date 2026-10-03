import { lessonTwoContent } from '@/data/lessons/stage-01-lesson-02/constants';
import type { LessonTwoAudio } from '@/hooks/use-lesson-two-audio/types';

type FrequencyContent = typeof lessonTwoContent.frequency;

export interface FrequencyPitchLabProps {
  content: FrequencyContent;
  audio: LessonTwoAudio;
  onComplete: () => void;
}
