import type { AttackLevel, DecayLevel, Fundamental, OvertoneLevel, OvertoneMultiple, TimbrePresetId, TimbreSound } from '@/data/lessons/stage-01-lesson-04-model/types';

export const fundamentals: readonly Fundamental[] = [220, 330, 440];

export const overtoneMultiples: readonly OvertoneMultiple[] = [2, 3, 4, 5];

// Strength of one overtone against the fundamental, which always sounds at 1.
export const overtoneStrengths: Record<OvertoneLevel, number> = { off: 0, weak: 0.3, strong: 0.8 };

export const attackLevels: readonly AttackLevel[] = ['instant', 'fast', 'slow'];

export const decayLevels: readonly DecayLevel[] = ['short', 'long', 'held'];

export const attackSeconds: Record<AttackLevel, number> = { instant: 0.005, fast: 0.06, slow: 0.5 };

// Time constant of the fall; `held` keeps the sound at full strength instead.
export const decaySeconds: Record<DecayLevel, number | null> = { short: 0.2, long: 0.7, held: null };

export const decayDurationSeconds: Record<DecayLevel, number> = { short: 1, long: 2, held: 1.6 };

// The longest any sound of this lesson runs. Every envelope is drawn against it, so
// a short sound ends sooner on the picture instead of being stretched to the same width.
export const maxSoundDuration = 2;

const silentOvertones = { 2: 'off', 3: 'off', 4: 'off', 5: 'off' } as const;

export const timbrePresets: Record<TimbrePresetId, TimbreSound> = {
  pure: { fundamental: 220, overtones: silentOvertones, attack: 'fast', decay: 'held' },
  pluck: { fundamental: 220, overtones: { 2: 'strong', 3: 'weak', 4: 'weak', 5: 'weak' }, attack: 'instant', decay: 'long' },
  bright: { fundamental: 220, overtones: { 2: 'strong', 3: 'strong', 4: 'strong', 5: 'strong' }, attack: 'fast', decay: 'held' },
};

// Every rendered sound is normalized, so one gain covers them all; Lesson 2 played its plucks at the same level.
export const playbackGain = 0.1;

export const waveResolution = 640;

export const envelopeResolution = 120;
