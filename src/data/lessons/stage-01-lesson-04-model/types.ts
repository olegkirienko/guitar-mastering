export type Fundamental = 220 | 330 | 440;

export type OvertoneMultiple = 2 | 3 | 4 | 5;

export type OvertoneLevel = 'off' | 'weak' | 'strong';

export type SoundingLevel = Exclude<OvertoneLevel, 'off'>;

export type AttackLevel = 'instant' | 'fast' | 'slow';

export type DecayLevel = 'short' | 'long' | 'held';

// The ideal string of this lesson: one fundamental that always sounds, overtones
// exactly ×2…×5 above it, and the two ends of the sound in time.
export type TimbreSound = {
  fundamental: Fundamental;
  overtones: Readonly<Record<OvertoneMultiple, OvertoneLevel>>;
  attack: AttackLevel;
  decay: DecayLevel;
};

export type TimbrePresetId = 'pure' | 'pluck' | 'bright';

// The two sounds of the checkpoint task; the learner builds both.
export type PairSoundId = 'a' | 'b';

// What «Перевірити» found: the goal is one pitch and two different timbres, so the
// pair fails either because the pitches differ or because the timbres do not.
export type PairResult = 'solved' | 'differentPitch' | 'sameTimbre';

// One component of the drawn sum; the fundamental is multiple 1 at full strength.
export type PartialStrength = { multiple: number; strength: number };

export type CurvePoint = { x: number; y: number };

export type TimbreCurves = {
  sum: readonly CurvePoint[];
  partials: readonly { multiple: number; points: readonly CurvePoint[] }[];
};

// Wording for the text alternative of a drawn wave; the numbers come from the model.
// `shape` opens the plain description used before the overtones are named.
export type WaveWords = {
  repeats: string;
  shape: string;
  overtones: string;
  noOvertones: string;
  levels: Record<SoundingLevel, string>;
};

// Wording for the text alternative of a drawn envelope. Whole phrases, not the short
// words of the controls: «Початок повільний (0,5 с); звук тримається».
export type EnvelopeWords = {
  attack: Readonly<Record<AttackLevel, string>>;
  decay: Readonly<Record<DecayLevel, string>>;
};
