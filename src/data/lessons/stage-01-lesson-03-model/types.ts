import type { densityLevels, lengthLevels, tensionLevels } from '@/data/lessons/stage-01-lesson-03-model/constants';

export type LengthLevel = (typeof lengthLevels)[number];
export type TensionLevel = (typeof tensionLevels)[number];
export type DensityLevel = (typeof densityLevels)[number];

export type StringFactor = 'length' | 'tension' | 'density';

export interface StringSettings {
  length: LengthLevel;
  tension: TensionLevel;
  density: DensityLevel;
}

// A checkpoint goal: move the pitch one way from `start` while `lockedFactor` stays put.
export interface CheckpointTask {
  id: string;
  start: StringSettings;
  lockedFactor: StringFactor;
  direction: 'higher' | 'lower';
}
