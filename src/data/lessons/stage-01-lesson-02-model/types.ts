import type { labFrequencies } from '@/data/lessons/stage-01-lesson-02-model/constants';

export type LabFrequency = (typeof labFrequencies)[number];
export type PitchChange = 'higher' | 'lower' | 'same';

export type ChainCard = 'repeats' | 'frequency' | 'pitch';
export type ChainAttemptOutcome = 'correct' | 'hint' | 'offer-explanation';
