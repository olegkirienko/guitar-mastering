import { labFrequencies, peakGainCap } from '@/data/lessons/stage-01-lesson-02-model/constants';
import type { LabFrequency, PitchChange } from '@/data/lessons/stage-01-lesson-02-model/types';

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

export function safeGain(gain: number): number {
  return Math.min(Math.max(gain, 0.0001), peakGainCap);
}
