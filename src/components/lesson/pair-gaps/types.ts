import type { LessonTwoAudio } from '@/hooks/use-lesson-two-audio/types';

export interface PairGapsContent {
  caption: string;
  pairLabel: (from: number, to: number) => string;
  listenLabel: string;
  stopLabel: string;
  options: readonly { semitones: number; label: string }[];
  right: string;
  wrong: string;
  headers: { pair: string; answer: string };
}

export interface PairGapsProps {
  content: PairGapsContent;
  base: number;
  audio: LessonTwoAudio;
  gain: number;
  // The size chosen for each pair, by its index in the row of pairs.
  choices: Readonly<Record<number, number>>;
  onChoose: (index: number, semitones: number) => void;
}
