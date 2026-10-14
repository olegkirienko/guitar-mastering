import { useRef } from 'react';
import type { KeyboardEvent } from 'react';

export function useFretBoard(selectable: readonly number[], onSelect?: (fret: number) => void) {
  const buttons = useRef<Record<number, HTMLButtonElement | null>>({});

  // Arrows move by one selectable fret, Home and End jump to the first and the last.
  const onKeyDown = (event: KeyboardEvent, fret: number) => {
    const index = selectable.indexOf(fret);
    const target = event.key === 'ArrowRight' || event.key === 'ArrowUp'
      ? selectable[index + 1]
      : event.key === 'ArrowLeft' || event.key === 'ArrowDown'
        ? selectable[index - 1]
        : event.key === 'Home'
          ? selectable[0]
          : event.key === 'End'
            ? selectable[selectable.length - 1]
            : undefined;
    if (!['ArrowRight', 'ArrowUp', 'ArrowLeft', 'ArrowDown', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    if (target === undefined) return;
    onSelect?.(target);
    buttons.current[target]?.focus();
  };

  return { buttons, onKeyDown };
}
