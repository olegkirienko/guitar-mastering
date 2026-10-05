export interface StringModeRow {
  id: string;
  // How many parts of the string swing on their own: 1 is the whole string.
  parts: number;
  label: string;
  description: string;
}

export interface StringModesDiagramContent {
  title: string;
  note: string;
  rows: readonly StringModeRow[];
}

export interface StringModesDiagramProps {
  content: StringModesDiagramContent;
}
