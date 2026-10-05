import type { Fundamental, OvertoneLevel, OvertoneMultiple, TimbreSound } from '@/data/lessons/stage-01-lesson-04-model/types';

// One partial named the way the lesson names it: never «перший обертон», always the
// multiple together with the frequency it stands for.
export function partialLabel(fundamental: Fundamental, multiple: number): string {
  return `×${multiple} · ${multiple * fundamental} Гц`;
}

export function withOvertone(sound: TimbreSound, multiple: OvertoneMultiple, level: OvertoneLevel): TimbreSound {
  return { ...sound, overtones: { ...sound.overtones, [multiple]: level } };
}
