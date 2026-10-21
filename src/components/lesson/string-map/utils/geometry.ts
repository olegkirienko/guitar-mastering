import { halfStringWidth, nutX, rowHeight, topPadding } from '@/components/lesson/string-map/constants';
import { fretPosition } from '@/data/lessons/stage-03-lesson-01-model/utils/frets';

// String 1 is drawn on top, string 6 at the bottom, as the player sees the guitar.
export function stringY(number: number): number {
  return topPadding + (number - 1) * rowHeight;
}

export function fretX(fret: number): number {
  return nutX + fretPosition(fret) * halfStringWidth * 2;
}

export function pressX(fret: number): number {
  return fret === 0 ? nutX - 14 : (fretX(fret - 1) + fretX(fret)) / 2;
}

export function stringWidth(number: number): number {
  return 1 + (number - 1) * 0.5;
}
