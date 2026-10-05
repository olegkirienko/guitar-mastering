import type { OvertoneLevel, TimbreSound } from '@/data/lessons/stage-01-lesson-04-model/types';

export interface SpectrumBarsContent {
  title: string;
  note: string;
  // Column headings of the table that carries the drawing in words.
  multipleColumn: string;
  frequencyColumn: string;
  strengthColumn: string;
  fundamentalStrength: string;
  levels: Readonly<Record<OvertoneLevel, string>>;
}

export interface SpectrumBarsProps {
  content: SpectrumBarsContent;
  sound: TimbreSound;
}
