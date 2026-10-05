import type { TimbreSound } from '@/data/lessons/stage-01-lesson-04-model/types';
import type { LessonTwoAudio } from '@/hooks/use-lesson-two-audio/types';

export interface TimbreSoundComparisonContent {
  caption: string;
  frequencyLabel: string;
  listenLabel: string;
  sounds: readonly { id: string; label: string; description: string; sound: TimbreSound }[];
}

export interface TimbreSoundComparisonProps {
  content: TimbreSoundComparisonContent;
  audio: LessonTwoAudio;
}
