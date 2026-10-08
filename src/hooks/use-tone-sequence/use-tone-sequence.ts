import { useCallback, useEffect, useRef, useState } from 'react';
import type { UseToneSequenceOptions } from '@/hooks/use-tone-sequence/types';

// Plays frequencies one after another; a new run cancels the previous one, and
// leaving the screen clears the timers. `index` is the tone being played, or -1.
export function useToneSequence({ audio, gain, gapMs }: UseToneSequenceOptions) {
  const [index, setIndex] = useState(-1);
  const timer = useRef<number | undefined>(undefined);
  const { playTone, stop: stopAudio } = audio;

  const clear = useCallback(() => window.clearTimeout(timer.current), []);

  const stop = useCallback(() => {
    clear();
    setIndex(-1);
    stopAudio();
  }, [clear, stopAudio]);

  const start = useCallback((frequencies: readonly number[]) => {
    clear();
    const step = (position: number) => {
      if (position >= frequencies.length) {
        setIndex(-1);
        return;
      }
      setIndex(position);
      playTone(frequencies[position], gain);
      timer.current = window.setTimeout(() => step(position + 1), gapMs);
    };
    step(0);
  }, [clear, playTone, gain, gapMs]);

  useEffect(() => clear, [clear]);

  return { index, playing: index !== -1, start, stop };
}
