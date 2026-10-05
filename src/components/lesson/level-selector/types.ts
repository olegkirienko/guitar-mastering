export interface LevelOption<Level extends string> {
  id: Level;
  label: string;
}

export interface LevelSelectorProps<Level extends string> {
  label: string;
  levels: readonly LevelOption<Level>[];
  value: Level;
  onChange: (level: Level) => void;
}
