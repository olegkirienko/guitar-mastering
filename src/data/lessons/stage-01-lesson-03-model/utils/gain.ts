import { safeGain } from '@/data/lessons/stage-01-lesson-02-model/utils/lab';
import { baseFrequency, basePluckGain } from '@/data/lessons/stage-01-lesson-03-model/constants';

// Lesson 2's pluck peak up to 220 Hz, softer above it, never above the shared cap.
export function pluckGain(frequency: number): number {
  return safeGain(basePluckGain * Math.min(1, Math.sqrt(baseFrequency / frequency)));
}
