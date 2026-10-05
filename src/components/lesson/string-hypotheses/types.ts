export interface HypothesisOption<Id extends string> {
  id: Id;
  label: string;
  // Shown under the list while this option is selected.
  note?: string;
}

export interface HypothesesContent<Id extends string> {
  hypothesesLabel: string;
  invitation: string;
  hypotheses: readonly HypothesisOption<Id>[];
  // The option that lets the learner write their own words.
  ownId: Id;
  ownLabel: string;
  feedback: string;
}

export interface StringHypothesesProps<Id extends string> {
  content: HypothesesContent<Id>;
  selected: readonly Id[];
  onToggle: (id: Id, isSelected: boolean) => void;
  own: string;
  onOwnChange: (value: string) => void;
}
