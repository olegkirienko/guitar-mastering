export interface KeyRowProps {
  label: string;
  count: number;
  base: number;
  // Builds the accessible name of a key.
  keyLabel: (key: number, frequency: string) => string;
  onPlay: (key: number) => void;
  // Keys drawn in the accent color: the ones just pressed or being played.
  highlighted?: readonly number[];
  // Keys drawn narrow and dark; the other keys are wide.
  narrowKeys?: readonly number[];
  // Text over a key's number, e.g. a revealed letter.
  // A line break in a caption puts the next name on its own line.
  captions?: Readonly<Record<number, string>>;
  // Keys found earlier: drawn with a dashed accent border, so the learner sees the trail.
  trail?: readonly number[];
}
