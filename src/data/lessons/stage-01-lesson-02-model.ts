// Pure models behind the Lesson 2 labs; components only render them.

// Screen 2: a slowed comparison, not literal audible frequencies.
export const comparisonRepeats = { a: 4, b: 8 } as const;
export const comparisonMoments = 16;
export const comparisonDurationMs = 6000;
// A frame never advances the shared timer by more than this, so a hidden tab
// (no frames) pauses the comparison instead of jumping to its end.
export const maxFrameDeltaMs = 50;

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

// Screen 6: the causal chain, ordered from observation to perception.
export type ChainCard = 'repeats' | 'frequency' | 'pitch';
export const correctChain: readonly ChainCard[] = ['repeats', 'frequency', 'pitch'];
// A fixed starting order that is wrong in every position.
export const initialChain: readonly ChainCard[] = ['pitch', 'repeats', 'frequency'];

export function moveCard(order: readonly ChainCard[], index: number, direction: -1 | 1): ChainCard[] {
  const target = index + direction;
  if (index < 0 || index >= order.length || target < 0 || target >= order.length) return [...order];
  const next = [...order];
  [next[index], next[target]] = [next[target], next[index]];
  return next;
}

export function chainIsCorrect(order: readonly ChainCard[]): boolean {
  return order.length === correctChain.length && order.every((card, index) => card === correctChain[index]);
}

// For each adjacent pair, whether it is one of the correct links.
export function correctAdjacentLinks(order: readonly ChainCard[]): boolean[] {
  return order.slice(0, -1).map((card, index) => correctChain.indexOf(card) + 1 === correctChain.indexOf(order[index + 1]));
}

export type ChainAttemptOutcome = 'correct' | 'hint' | 'offer-explanation';

// First failed order shows the hint; later failures offer the explanation.
export function chainAttemptOutcome(order: readonly ChainCard[], failedAttempts: number): ChainAttemptOutcome {
  if (chainIsCorrect(order)) return 'correct';
  return failedAttempts === 0 ? 'hint' : 'offer-explanation';
}

// Passing needs the chain (built alone or after the explanation) and a correct
// answer to the counterexample asked after it. First tries and audio are optional.
export function checkpointPassed(chainDone: boolean, counterexampleCorrect: boolean): boolean {
  return chainDone && counterexampleCorrect;
}
