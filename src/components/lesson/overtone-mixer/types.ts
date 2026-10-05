import type { LevelOption } from '@/components/lesson/level-selector/types';
import type { OvertoneLevel, OvertoneMultiple, TimbreSound } from '@/data/lessons/stage-01-lesson-04-model/types';

export interface OvertoneMixerContent {
  title: string;
  note: string;
  // The fundamental is shown, never switched: it is what the pitch is.
  fundamentalNote: string;
}

export interface OvertoneMixerProps {
  content: OvertoneMixerContent;
  multiples: readonly OvertoneMultiple[];
  levels: readonly LevelOption<OvertoneLevel>[];
  sound: TimbreSound;
  onChange: (multiple: OvertoneMultiple, level: OvertoneLevel) => void;
}
