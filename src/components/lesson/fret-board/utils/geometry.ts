import { halfStringWidth, nutX } from '@/components/lesson/fret-board/constants';
import { fretLengthFraction, fretPosition } from '@/data/lessons/stage-03-lesson-01-model/utils/frets';

// Frets crowd together towards the 12th, as on a real neck.
export function fretX(fret: number): number {
  return nutX + fretPosition(fret) * halfStringWidth * 2;
}

// The finger presses between the previous fret and this one; the open string is marked at the nut.
export function pressX(fret: number): number {
  return fret === 0 ? nutX - 14 : (fretX(fret - 1) + fretX(fret)) / 2;
}

export function lengthFractionText(fret: number): string {
  if (fret === 0) return '1';
  if (fret === 12) return '1/2';
  return fretLengthFraction(fret).toFixed(2).replace('.', ',');
}
