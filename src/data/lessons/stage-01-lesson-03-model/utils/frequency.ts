import { baseFrequency, densityLevels, lengthLevels, tensionLevels } from '@/data/lessons/stage-01-lesson-03-model/constants';
import type { StringFactor, StringSettings } from '@/data/lessons/stage-01-lesson-03-model/types';

// Whole hertz: shorter → more often, tighter → more often, heavier per centimetre → less often.
export function stringFrequency({ length, tension, density }: StringSettings): number {
  return Math.round(baseFrequency * (1 / length) * Math.sqrt(tension) / Math.sqrt(density));
}

export function factorLevels(factor: StringFactor): readonly number[] {
  if (factor === 'length') return lengthLevels;
  if (factor === 'tension') return tensionLevels;
  return densityLevels;
}

// The settings with one factor moved to the level at `index`, the others unchanged.
export function withFactorLevel(settings: StringSettings, factor: StringFactor, index: number): StringSettings {
  if (factor === 'length') return { ...settings, length: lengthLevels[index] ?? settings.length };
  if (factor === 'tension') return { ...settings, tension: tensionLevels[index] ?? settings.tension };
  return { ...settings, density: densityLevels[index] ?? settings.density };
}

export function sameSettings(first: StringSettings, second: StringSettings): boolean {
  return first.length === second.length && first.tension === second.tension && first.density === second.density;
}

export function factorLevelIndex(settings: StringSettings, factor: StringFactor): number {
  return factorLevels(factor).indexOf(settings[factor]);
}
