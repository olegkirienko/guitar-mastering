import type { FrequencyComparisonProps } from '@/components/lesson/frequency-comparison/types';
import { comparisonDurationMs, comparisonMoments, comparisonRepeats } from '@/data/lessons/stage-01-lesson-02-model/constants';
import { advanceElapsed, completedRepeats, momentFraction } from '@/data/lessons/stage-01-lesson-02-model/utils/comparison-timing';
import { useEffect, useRef, useState } from 'react';

export function useFrequencyComparison({ staticMode, onComplete }: Pick<FrequencyComparisonProps, 'staticMode' | 'onComplete'>) {
  const [predicted, setPredicted] = useState(false);
  const [fraction, setFraction] = useState(0);
  const [running, setRunning] = useState(false);
  const [resultShown, setResultShown] = useState(false);
  const [soundPredicted, setSoundPredicted] = useState(false);
  const frame = useRef<number>(undefined);
  const finished = fraction >= 1;
  const moment = Math.round(fraction * comparisonMoments);

  useEffect(() => () => {
    if (frame.current !== undefined) cancelAnimationFrame(frame.current);
  }, []);

  useEffect(() => {
    if (staticMode && running) {
      if (frame.current !== undefined) cancelAnimationFrame(frame.current);
      setRunning(false);
    }
  }, [running, staticMode]);

  const reported = useRef(false);
  useEffect(() => {
    if (!predicted || !finished || reported.current) return;
    reported.current = true;
    onComplete();
  }, [finished, onComplete, predicted]);

  const run = () => {
    if (running) return;
    setFraction(0);
    setRunning(true);
    let elapsed = 0;
    let previous = performance.now();
    // Capped per-frame steps: with no frames on a hidden tab, the run pauses.
    const tick = (now: number) => {
      elapsed = advanceElapsed(elapsed, now - previous);
      previous = now;
      const next = elapsed / comparisonDurationMs;
      setFraction(next);
      if (next < 1) frame.current = requestAnimationFrame(tick);
      else setRunning(false);
    };
    frame.current = requestAnimationFrame(tick);
  };
  const nextMoment = () => { if (!finished) setFraction(momentFraction(moment + 1)); };
  const showSummary = () => { if (!finished) setFraction(1); };
  const disabledLook = 'aria-disabled:cursor-not-allowed aria-disabled:opacity-50';

  const countA = completedRepeats(comparisonRepeats.a, fraction);
  const countB = completedRepeats(comparisonRepeats.b, fraction);

  return { predicted, setPredicted, fraction, running, resultShown, setResultShown, soundPredicted, setSoundPredicted, finished, run, nextMoment, showSummary, disabledLook, countA, countB };
}
