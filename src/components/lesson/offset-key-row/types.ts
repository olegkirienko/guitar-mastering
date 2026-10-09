export interface OffsetKeyRowProps {
  label: string;
  // The absolute key (0..11) that the first key of the row stands for.
  start: number;
  colors: { white: string; black: string };
  keyLabel: (key: number, color: string, frequency: string, spokenNames: readonly string[]) => string;
  // Receives the key's place in the row (0..12), not its absolute number.
  onPlay: (key: number) => void;
  highlighted?: readonly number[];
  trail?: readonly number[];
  captions?: Readonly<Record<number, string>>;
}
