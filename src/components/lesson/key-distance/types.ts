import type { lessonSevenContent } from '@/data/lessons/stage-02-lesson-02/constants';
import type { LessonTwoAudio } from '@/hooks/use-lesson-two-audio/types';

export type KeyDistanceContent = typeof lessonSevenContent.semitone;

export interface KeyDistanceProps {
  content: KeyDistanceContent;
  keyRowLabel: string;
  keyLabel: (key: number, frequency: string) => string;
  audio: LessonTwoAudio;
  gain: number;
}
