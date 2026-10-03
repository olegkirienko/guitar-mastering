import { comparisonDurationMs, comparisonMoments, maxFrameDeltaMs } from '@/data/lessons/stage-01-lesson-02-model/constants';

export function advanceElapsed(elapsedMs: number, frameDeltaMs: number): number {
  return Math.min(elapsedMs + Math.min(Math.max(frameDeltaMs, 0), maxFrameDeltaMs), comparisonDurationMs);
}

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
