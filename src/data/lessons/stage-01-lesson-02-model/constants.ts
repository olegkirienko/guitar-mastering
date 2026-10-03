import type { ChainCard, LabFrequency } from '@/data/lessons/stage-01-lesson-02-model/types';

// Pure models behind the Lesson 2 labs; components only render them.

// Screen 2: a slowed comparison, not literal audible frequencies.
export const comparisonRepeats = { a: 4, b: 8 } as const;
export const comparisonMoments = 16;
export const comparisonDurationMs = 6000;
// A frame never advances the shared timer by more than this, so a hidden tab
// (no frames) pauses the comparison instead of jumping to its end.
export const maxFrameDeltaMs = 50;

// Screen 3: discrete lab values.
export const labFrequencies = [220, 330, 440] as const;

// Audio safety: nothing is ever louder than Lesson 1's plucked-string peak.
export const peakGainCap = 0.12;
// Slight compensation keeps the pure tones' perceived loudness comparable.
export const toneGain: Record<LabFrequency, number> = { 220: 0.09, 330: 0.08, 440: 0.075 };
export const loudnessGain = { quiet: 0.035, loud: 0.1 } as const;
export const toneDurationSeconds = 0.9;
export const stringPluckFrequency = { open: 329.63, pressed: 369.99 } as const;

// Screen 6: the causal chain, ordered from observation to perception.
export const correctChain: readonly ChainCard[] = ['repeats', 'frequency', 'pitch'];
// A fixed starting order that is wrong in every position.
export const initialChain: readonly ChainCard[] = ['pitch', 'repeats', 'frequency'];
