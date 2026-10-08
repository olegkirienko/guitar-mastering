import type { LessonTwoAudio } from '@/hooks/use-lesson-two-audio/types';

export interface UseToneSequenceOptions {
  audio: LessonTwoAudio;
  gain: number;
  // Pause between the start of one tone and the start of the next.
  gapMs: number;
}
