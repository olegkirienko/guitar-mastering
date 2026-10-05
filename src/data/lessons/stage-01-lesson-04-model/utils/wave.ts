import { overtoneMultiples, waveResolution } from '@/data/lessons/stage-01-lesson-04-model/constants';
import type { CurvePoint, Fundamental, OvertoneMultiple, PartialStrength, SoundingLevel, TimbreCurves, TimbreSound, WaveWords } from '@/data/lessons/stage-01-lesson-04-model/types';
import { partialStrengths } from '@/data/lessons/stage-01-lesson-04-model/utils/partials';

// Lesson 2 drew a higher sound as more repeats in the same time; keeping that rule
// makes 330 Hz visibly denser than 220 Hz instead of identical.
export function visualRepeats(fundamental: Fundamental): number {
  return 3 * fundamental / 220;
}

// `phase` counts repeats of the fundamental, so the sum comes back to itself with
// every whole step no matter which overtones are added.
export function waveValue(partials: readonly PartialStrength[], phase: number): number {
  return partials.reduce((sum, partial) => sum + partial.strength * Math.sin(2 * Math.PI * partial.multiple * phase), 0);
}

// The sum and its components on one scale: a weak overtone has to look weak next
// to the sum it is part of, so everything is divided by the sum's own peak.
export function waveCurves(sound: TimbreSound, count = waveResolution): TimbreCurves {
  const partials = partialStrengths(sound);
  const repeats = visualRepeats(sound.fundamental);
  const phases = Array.from({ length: count }, (_, index) => index / (count - 1) * repeats);
  const sum = phases.map((phase) => waveValue(partials, phase));
  const peak = Math.max(...sum.map(Math.abs), Number.EPSILON);
  const toPoints = (values: readonly number[]): CurvePoint[] => values.map((value, index) => ({ x: index / (count - 1), y: value / peak }));
  return {
    sum: toPoints(sum),
    partials: partials.map((partial) => ({ multiple: partial.multiple, points: toPoints(phases.map((phase) => waveValue([partial], phase))) })),
  };
}

function repeatsText(fundamental: Fundamental): string {
  return String(visualRepeats(fundamental)).replace('.', ',');
}

export function waveDescription(sound: TimbreSound, words: WaveWords): string {
  const repeats = `${words.repeats}: ${repeatsText(sound.fundamental)}`;
  const sounding = overtoneMultiples
    .map((multiple) => ({ multiple, level: sound.overtones[multiple] }))
    .filter((overtone): overtone is { multiple: OvertoneMultiple; level: SoundingLevel } => overtone.level !== 'off');
  if (sounding.length === 0) return `${repeats}; ${words.noOvertones}`;
  return `${repeats}; ${words.overtones}: ${sounding.map((overtone) => `×${overtone.multiple} ${words.levels[overtone.level]}`).join(', ')}`;
}
