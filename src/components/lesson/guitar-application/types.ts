import type { PitchPath } from '@/components/lesson/same-string-pitch-experience/types';
import { lessonTwoContent } from '@/data/lessons/stage-01-lesson-02/constants';
import type { LessonTwoAudio } from '@/hooks/use-lesson-two-audio/types';

type GuitarContent = typeof lessonTwoContent.guitar;

export interface GuitarApplicationProps {
  content: GuitarContent;
  preferredPath: PitchPath;
  audio: LessonTwoAudio;
  completed: boolean;
  onComplete: () => void;
}
