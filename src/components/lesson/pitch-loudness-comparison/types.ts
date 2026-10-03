import { lessonTwoContent } from '@/data/lessons/stage-01-lesson-02/constants';
import type { LessonTwoAudio } from '@/hooks/use-lesson-two-audio/types';

type LoudnessContent = typeof lessonTwoContent.loudness;

export interface PitchLoudnessComparisonProps {
  content: LoudnessContent;
  audio: LessonTwoAudio;
  onComplete: () => void;
}
