import type { LessonTwoAudio } from '@/hooks/use-lesson-two-audio/types';

export interface ToneSequenceItem {
  id: string;
  label: string;
  frequencies: readonly number[];
}

export interface ToneSequenceProps {
  sequences: readonly ToneSequenceItem[];
  stopLabel: string;
  audio: LessonTwoAudio;
  gain: number;
  gapMs?: number;
  onPlay?: (id: string) => void;
}
