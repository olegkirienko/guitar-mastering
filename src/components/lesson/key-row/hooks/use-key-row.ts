import { useRef } from 'react';
import type { KeyboardEvent } from 'react';

// ←/→ move focus between the keys; Home/End jump to the ends.
export function useKeyRow(count: number) {
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);

  const onKeyDown = (event: KeyboardEvent, key: number) => {
    const target = event.key === 'ArrowRight' ? Math.min(key + 1, count - 1)
      : event.key === 'ArrowLeft' ? Math.max(key - 1, 0)
        : event.key === 'Home' ? 0
          : event.key === 'End' ? count - 1
            : null;
    if (target === null) return;
    event.preventDefault();
    buttons.current[target]?.focus();
  };

  return { buttons, onKeyDown };
}
