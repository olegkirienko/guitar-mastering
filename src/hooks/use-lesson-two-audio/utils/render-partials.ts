import { partialsFadeSeconds } from '@/hooks/use-lesson-two-audio/constants';
import type { PartialsSound } from '@/hooks/use-lesson-two-audio/types';

// Adds every partial as a sine, shapes the sum with the same rise and fall the
// drawn envelope shows, fades the tail so the buffer ends in silence, and
// normalizes the peak to 1 so the caller's gain alone decides the loudness.
export function renderPartials(sampleRate: number, sound: PartialsSound): Float32Array {
  const length = Math.round(sampleRate * sound.durationSeconds);
  const samples = new Float32Array(length);
  let peak = 0;
  for (let index = 0; index < length; index += 1) {
    const seconds = index / sampleRate;
    let value = 0;
    for (const partial of sound.partials) value += partial.strength * Math.sin(2 * Math.PI * partial.frequency * seconds);
    const rise = seconds >= sound.attackSeconds ? 1 : seconds / sound.attackSeconds;
    const fall = sound.decaySeconds === null ? 1 : Math.exp(-Math.max(seconds - sound.attackSeconds, 0) / sound.decaySeconds);
    const remaining = sound.durationSeconds - seconds;
    const fade = remaining >= partialsFadeSeconds ? 1 : Math.max(remaining, 0) / partialsFadeSeconds;
    const shaped = value * rise * fall * fade;
    samples[index] = shaped;
    peak = Math.max(peak, Math.abs(shaped));
  }
  if (peak > 0) for (let index = 0; index < length; index += 1) samples[index] /= peak;
  return samples;
}
