import { maxFrequency, minFrequency, octaveTolerance } from '@/data/lessons/stage-02-lesson-01-model/constants';
import type { OctaveDirection } from '@/data/lessons/stage-02-lesson-01-model/types';

// Whole hertz inside the doubler's range; a typed-in fraction is rounded first.
export function clampFrequency(frequency: number): number {
  return Math.min(maxFrequency, Math.max(minFrequency, Math.round(frequency)));
}

// The frequency an octave above or below, or `null` when it would leave the range.
export function octaveOf(frequency: number, direction: OctaveDirection): number | null {
  const next = direction === 'up' ? frequency * 2 : frequency / 2;
  return next >= minFrequency && next <= maxFrequency ? next : null;
}

// Two sounds are an octave apart when the higher one is twice the lower, give or take the tolerance.
export function isOctaveOf(a: number, b: number, tolerance: number = octaveTolerance): boolean {
  const [low, high] = a <= b ? [Math.round(a), Math.round(b)] : [Math.round(b), Math.round(a)];
  return Math.abs(high / 2 - low) <= tolerance;
}
