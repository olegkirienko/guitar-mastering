import { attackSeconds, decayDurationSeconds, decaySeconds, overtoneMultiples, overtoneStrengths } from '@/data/lessons/stage-01-lesson-04-model/constants';
import type { PartialStrength, TimbreSound } from '@/data/lessons/stage-01-lesson-04-model/types';
import type { PartialsSound } from '@/hooks/use-lesson-two-audio/types';

// The fundamental always sounds, so it is multiple 1 at full strength; overtones
// switched off are left out instead of being added as silence.
export function partialStrengths(sound: TimbreSound): PartialStrength[] {
  return [
    { multiple: 1, strength: 1 },
    ...overtoneMultiples
      .map((multiple) => ({ multiple, strength: overtoneStrengths[sound.overtones[multiple]] }))
      .filter((partial) => partial.strength > 0),
  ];
}

export function toPartialsSound(sound: TimbreSound): PartialsSound {
  return {
    partials: partialStrengths(sound).map(({ multiple, strength }) => ({ frequency: multiple * sound.fundamental, strength })),
    attackSeconds: attackSeconds[sound.attack],
    decaySeconds: decaySeconds[sound.decay],
    durationSeconds: decayDurationSeconds[sound.decay],
  };
}
