// Pure models behind the Lesson 2 labs; components only render them.

// Screen 2: a slowed comparison, not literal audible frequencies.
export const comparisonRepeats = { a: 4, b: 8 } as const;
export const comparisonMoments = 16;
export const comparisonDurationMs = 6000;

function clampFraction(fraction: number): number {
  return Math.min(Math.max(fraction, 0), 1);
}

export function momentFraction(moment: number): number {
  return clampFraction(moment / comparisonMoments);
}

// Full repeats completed after the given share of the shared time window.
export function completedRepeats(repeats: number, fraction: number): number {
  return Math.floor(repeats * clampFraction(fraction) + 1e-9);
}

// Horizontal offset of a track's dot in [-1, 1] after the given share of time.
export function trackOffset(repeats: number, fraction: number): number {
  return Math.cos(2 * Math.PI * repeats * clampFraction(fraction));
}

// Screen 3: discrete lab values.
export const labFrequencies = [220, 330, 440] as const;
export type LabFrequency = (typeof labFrequencies)[number];
export type PitchChange = 'higher' | 'lower' | 'same';

export function stepFrequency(current: LabFrequency, direction: -1 | 1): LabFrequency {
  const index = labFrequencies.indexOf(current);
  return labFrequencies[Math.min(Math.max(index + direction, 0), labFrequencies.length - 1)];
}

export function pitchChange(from: number, to: number): PitchChange {
  if (to > from) return 'higher';
  if (to < from) return 'lower';
  return 'same';
}

export function labFeedback(from: LabFrequency, to: LabFrequency): string {
  const change = pitchChange(from, to);
  if (change === 'higher') return `${from} → ${to}: за секунду повторів стало більше, тому звук став вищим.`;
  if (change === 'lower') return `${from} → ${to}: за секунду повторів стало менше, тому звук став нижчим.`;
  return `${from} → ${to}: кількість повторів за секунду не змінилася, тому висота та сама.`;
}

// Visual density only: cycles drawn across the schematic track.
export function visualCycles(frequency: LabFrequency): number {
  return frequency / 55;
}

// Audio safety: nothing is ever louder than Lesson 1's plucked-string peak.
export const peakGainCap = 0.12;
// Slight compensation keeps the pure tones' perceived loudness comparable.
export const toneGain: Record<LabFrequency, number> = { 220: 0.09, 330: 0.08, 440: 0.075 };
export const loudnessGain = { quiet: 0.035, loud: 0.1 } as const;
export const toneDurationSeconds = 0.9;
export const stringPluckFrequency = { open: 329.63, pressed: 369.99 } as const;

export function safeGain(gain: number): number {
  return Math.min(Math.max(gain, 0.0001), peakGainCap);
}
