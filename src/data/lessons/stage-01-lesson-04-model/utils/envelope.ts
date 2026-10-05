import { attackSeconds, decayDurationSeconds, decaySeconds, envelopeResolution } from '@/data/lessons/stage-01-lesson-04-model/constants';
import type { CurvePoint, TimbreSound } from '@/data/lessons/stage-01-lesson-04-model/types';

export function soundDuration(sound: TimbreSound): number {
  return decayDurationSeconds[sound.decay];
}

// Loudness over time, the same shape the rendered sound is given: a straight rise
// to full strength, then an exponential fall, or none at all when the sound is held.
export function envelopeValue(sound: TimbreSound, seconds: number): number {
  const attack = attackSeconds[sound.attack];
  const decay = decaySeconds[sound.decay];
  const rise = seconds >= attack ? 1 : Math.max(seconds, 0) / attack;
  const fall = decay === null ? 1 : Math.exp(-Math.max(seconds - attack, 0) / decay);
  return rise * fall;
}

export function envelopePoints(sound: TimbreSound, count = envelopeResolution): CurvePoint[] {
  const duration = soundDuration(sound);
  return Array.from({ length: count }, (_, index) => {
    const x = index / (count - 1);
    return { x, y: envelopeValue(sound, x * duration) };
  });
}
