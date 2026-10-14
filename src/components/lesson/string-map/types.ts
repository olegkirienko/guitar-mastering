export interface StringMapContent {
  // Accessible name of the whole picture.
  label: string;
  stringButtons: string;
  fretPicker: string;
}

export interface StringMapProps {
  content: StringMapContent;
  // String numbers 1..6 whose note has been revealed; the rest show only the number.
  revealed: readonly number[];
  // The string chosen by the learner, drawn with a frame.
  selected?: number | null;
  // Strings drawn emphasised (e.g. the pair being compared).
  highlighted?: readonly number[];
  // The string pressed at a fret; `null` draws all strings open.
  pressed?: { string: number; fret: number } | null;
  onSelectString?: (number: number) => void;
  // Frets the learner can choose for the pressed string; empty hides the picker.
  selectableFrets?: readonly number[];
  fret?: number;
  onSelectFret?: (fret: number) => void;
  // Accessible names of a string button and of a fret button.
  describeString: (number: number) => string;
  describeFret: (fret: number) => string;
}
