import type { FrequencyPitchLabProps } from '@/components/lesson/frequency-pitch-lab/types';
import { labFrequencies } from '@/data/lessons/stage-01-lesson-02-model/constants';
import type { LabFrequency } from '@/data/lessons/stage-01-lesson-02-model/types';
import { labFeedback } from '@/data/lessons/stage-01-lesson-02-model/utils/lab';
import { useEffect, useId, useRef, useState } from 'react';

export function useFrequencyPitchLab({ content, onComplete }: Pick<FrequencyPitchLabProps, 'content' | 'onComplete'>) {
  const [revealed, setRevealed] = useState(0);
  const [frequency, setFrequency] = useState<LabFrequency>(220);
  const [baseline, setBaseline] = useState<LabFrequency>(220);
  const [prediction, setPrediction] = useState<string>();
  const [feedback, setFeedback] = useState<string>();
  const [checkedOnce, setCheckedOnce] = useState(false);
  const [focusTarget, setFocusTarget] = useState<'card' | 'slider' | null>(null);
  const reported = useRef(false);
  const card = useRef<HTMLElement>(null);
  const slider = useRef<HTMLInputElement>(null);
  const sliderId = useId();
  const predictionName = useId();
  const total = content.revealItems.length;
  const allRevealed = revealed >= total;
  const changed = frequency !== baseline;
  const atLowest = frequency === labFrequencies[0];
  const atHighest = frequency === labFrequencies[labFrequencies.length - 1];

  useEffect(() => {
    if (!allRevealed || !checkedOnce || reported.current) return;
    reported.current = true;
    onComplete();
  }, [allRevealed, checkedOnce, onComplete]);

  // Controls that disappear hand focus to the next place to continue from.
  useEffect(() => {
    if (focusTarget === 'card') card.current?.focus();
    if (focusTarget === 'slider') slider.current?.focus();
    if (focusTarget) setFocusTarget(null);
  }, [focusTarget]);

  const reveal = () => {
    const next = Math.min(revealed + 1, total);
    setRevealed(next);
    if (next === total) setFocusTarget('card');
  };
  const change = (next: LabFrequency) => {
    setFrequency(next);
    setPrediction(undefined);
    setFeedback(undefined);
  };
  const check = () => {
    if (!changed || !prediction) return;
    setFeedback(labFeedback(baseline, frequency));
    setBaseline(frequency);
    setPrediction(undefined);
    setCheckedOnce(true);
    setFocusTarget('slider');
  };
  const itemsIn = (column: 'happens' | 'perceive') => content.revealItems
    .slice(0, revealed)
    .filter((item) => item.column === column);

  return { frequency, prediction, setPrediction, feedback, card, slider, sliderId, predictionName, allRevealed, changed, atLowest, atHighest, reveal, change, check, itemsIn };
}
