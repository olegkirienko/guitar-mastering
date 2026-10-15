export interface StringOrderContent {
  title: string;
  help: string;
  up: string;
  down: string;
  check: string;
  right: string;
  wrong: string;
  item: (number: number, position: number) => string;
}

export interface StringOrderProps {
  content: StringOrderContent;
  start: readonly number[];
  correct: readonly number[];
  onPlay: (number: number) => void;
  onSubmit: () => void;
}
