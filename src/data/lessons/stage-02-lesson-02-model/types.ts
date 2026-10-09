export interface StepTableRow {
  key: number;
  frequency: number;
  // `null` for the first key, which has no previous one.
  difference: number | null;
  ratio: number | null;
}
