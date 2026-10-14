export interface FretBoardContent {
  // Accessible name of the whole picture.
  label: string;
  picker: string;
  lengthTitle: string;
  lengthText: (fraction: string) => string;
  selected: (fret: number) => string;
}

export interface FretBoardProps {
  content: FretBoardContent;
  // The fret drawn as pressed; `null` draws the open string only.
  selected: number | null;
  // Frets the learner can choose; empty draws a static picture.
  selectable?: readonly number[];
  onSelect?: (fret: number) => void;
  // Accessible name of a fret button, e.g. «лад 3, 3 півтони, нота C, 131 Гц».
  describe: (fret: number) => string;
  showLength?: boolean;
}
