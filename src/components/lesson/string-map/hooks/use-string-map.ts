import { useRef } from 'react';
import type { KeyboardEvent } from 'react';

const moves: Record<string, 1 | -1> = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 };

// Arrows move through a row of buttons; Home and End jump to its ends.
function target(event: KeyboardEvent, values: readonly number[], current: number): number | undefined {
  const index = values.indexOf(current);
  if (event.key === 'Home') return values[0];
  if (event.key === 'End') return values[values.length - 1];
  const step = moves[event.key];
  return step === undefined ? undefined : values[index + step];
}

export function useStringMap(stringOrder: readonly number[], frets: readonly number[], onSelectString?: (number: number) => void, onSelectFret?: (fret: number) => void) {
  const stringButtons = useRef<Record<number, HTMLButtonElement | null>>({});
  const fretButtons = useRef<Record<number, HTMLButtonElement | null>>({});

  const onStringKeyDown = (event: KeyboardEvent, number: number) => {
    if (!(event.key in moves) && event.key !== 'Home' && event.key !== 'End') return;
    event.preventDefault();
    const next = target(event, stringOrder, number);
    if (next === undefined) return;
    onSelectString?.(next);
    stringButtons.current[next]?.focus();
  };
  const onFretKeyDown = (event: KeyboardEvent, fret: number) => {
    if (!(event.key in moves) && event.key !== 'Home' && event.key !== 'End') return;
    event.preventDefault();
    const next = target(event, frets, fret);
    if (next === undefined) return;
    onSelectFret?.(next);
    fretButtons.current[next]?.focus();
  };

  return { stringButtons, fretButtons, onStringKeyDown, onFretKeyDown };
}
