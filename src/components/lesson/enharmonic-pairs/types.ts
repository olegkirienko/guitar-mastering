export interface EnharmonicPairsContent {
  caption: string;
  leftTitle: string;
  rightTitle: string;
  pickFirst: string;
  picked: (name: string) => string;
  matched: (first: string, second: string) => string;
  miss: (first: string, second: string) => string;
  done: string;
}

export interface EnharmonicPairsProps {
  content: EnharmonicPairsContent;
  left: readonly string[];
  right: readonly string[];
  onSolved: () => void;
}
