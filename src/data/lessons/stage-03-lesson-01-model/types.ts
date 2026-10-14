import type { sharpNames } from '@/data/lessons/stage-03-lesson-01-model/constants';

export type FretNote = (typeof sharpNames)[number];

export interface OpenString {
  name: string;
  // The pitch class (0..11, C = 0) of the open string.
  openKey: number;
  openNote: FretNote;
  frequency: number;
}
