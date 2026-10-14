import type { FretBoardContent } from '@/components/lesson/fret-board/types';
import type { OpenString } from '@/data/lessons/stage-03-lesson-01-model/types';

export interface FretExplorerContent {
  modes: { explore: string; predict: string };
  modeLabel: string;
  fretLabel: string;
  semitonesLabel: string;
  noteLabel: string;
  frequencyLabel: string;
  play: string;
  exploreHint: (openNote: string) => string;
  withoutAudio: string;
  startPredict: string;
  predictTitle: string;
  predictQuestion: (fret: number) => string;
  predictPrompt: (done: number, total: number) => string;
  explain: (fret: number, note: string, openNote: string) => string;
  rule: string;
  tableTitle: string;
  tableRow: (fret: number, note: string) => string;
  nextTask: string;
  stepDown: string;
  stepUp: string;
}

export interface FretExplorerProps {
  content: FretExplorerContent;
  board: FretBoardContent;
  openString: OpenString;
  // Frets of the «predict» mode, one note question each.
  predictFrets: readonly number[];
  audioEnabled: boolean;
  keyRowLabel: string;
  keyLabel: (key: number, frequency: string) => string;
  // Accessible name of a fret button.
  describe: (fret: number) => string;
  onPlay: (frequency: number) => void;
  onSolved: () => void;
}

export type ExplorerMode = 'explore' | 'predict';
