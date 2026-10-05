import type { StringFactor, StringSettings } from '@/data/lessons/stage-01-lesson-03-model/types';

// Pure model behind the Lesson 3 labs: an ideal uniform string; components only render it.

export const baseFrequency = 220;

export const factorOrder: readonly StringFactor[] = ['length', 'tension', 'density'];

// Each level is a multiplier of the base string: length shortens, tension and density grow.
export const lengthLevels = [1, 0.75, 0.5] as const;
export const tensionLevels = [1, 2.25, 4] as const;
export const densityLevels = [1, 2.25, 4] as const;

export const defaultStringSettings: StringSettings = { length: 1, tension: 1, density: 1 };

// Level names avoid the factor terms, which appear only after each experiment.
export const levelLabels: { [Factor in StringFactor]: readonly string[] } = {
  length: ['повна довжина', '¾ довжини', '½ довжини'],
  tension: ['звичайно', 'тугіше', 'найтугіше'],
  density: ['легка', 'важча', 'найважча'],
};

// Lesson 2's plucked-string peak; higher plucks only get quieter.
export const basePluckGain = 0.1;
