import { sameStringExperience } from '@/data/lessons/stage-01-lesson-02/constants';
import type { LessonTwoAudio } from '@/hooks/use-lesson-two-audio/types';

type StringContent = typeof sameStringExperience;

export type PitchPath = 'guitar' | 'virtual';

export interface SameStringPitchExperienceProps {
  content: StringContent;
  preferredPath: PitchPath;
  audio?: LessonTwoAudio;
  onReady: () => void;
}
