import type { StringSettings } from '@/data/lessons/stage-01-lesson-03-model/types';
import type { LessonTwoAudio } from '@/hooks/use-lesson-two-audio/types';

export interface StringPairString {
  id: string;
  label: string;
  settings: StringSettings;
  description: string;
}

export interface StringPairProps {
  caption: string;
  strings: readonly StringPairString[];
  pluckLabel: string;
  audio: LessonTwoAudio;
}
