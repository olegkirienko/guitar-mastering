export interface KeyRowProps {
  label: string;
  count: number;
  base: number;
  // Builds the accessible name of a key.
  keyLabel: (key: number, frequency: string) => string;
  onPlay: (key: number) => void;
  // Keys drawn in the accent color: the ones just pressed or being played.
  highlighted?: readonly number[];
}
