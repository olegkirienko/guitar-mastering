import type { AttackLevel, DecayLevel, TimbreSound } from '@/data/lessons/stage-01-lesson-04-model/types';

export interface EnvelopeControlsContent {
  title: string;
  note: string;
  // The curve drawn under the two regulators.
  curveLabel: string;
  attackLabel: string;
  decayLabel: string;
  // Short words for the chips; the curve's own sentence spells them out in full.
  attacks: Readonly<Record<AttackLevel, string>>;
  decays: Readonly<Record<DecayLevel, string>>;
}

export interface EnvelopeControlsProps {
  content: EnvelopeControlsContent;
  sound: TimbreSound;
  onAttack: (attack: AttackLevel) => void;
  onDecay: (decay: DecayLevel) => void;
}
