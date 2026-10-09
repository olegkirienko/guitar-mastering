import { useEffect, useState } from 'react';
import type { StepWalkAnswer, StepWalkProps } from '@/components/lesson/step-walk/types';
import { baseFrequency, keysInOctave, lastKeyNumber } from '@/data/lessons/stage-02-lesson-02-model/constants';
import { keyFrequency } from '@/data/lessons/stage-02-lesson-02-model/utils/keys';
import { useToneSequence } from '@/hooks/use-tone-sequence/use-tone-sequence';

const walkGapMs = 500;

const allFrequencies = Array.from({ length: lastKeyNumber + 1 }, (_, key) => keyFrequency(baseFrequency, key));

// The learner counts the steps; a typed number is rounded, and an empty one is not checked.
export function useStepWalk({ audio, gain, onDone }: Pick<StepWalkProps, 'audio' | 'gain' | 'onDone'>) {
  const sequence = useToneSequence({ audio, gain, gapMs: walkGapMs });
  const [answer, setAnswer] = useState('');
  const [result, setResult] = useState<StepWalkAnswer>('none');
  const [walked, setWalked] = useState(0);

  const play = () => {
    setWalked(0);
    sequence.start(allFrequencies);
  };
  // The counter follows the sequence, and keeps the last value after it ends.
  useEffect(() => {
    if (sequence.index !== -1) setWalked(sequence.index);
  }, [sequence.index]);

  const check = () => {
    if (answer.trim() === '') return;
    const right = Math.round(Number(answer.replace(',', '.'))) === keysInOctave;
    setResult(right ? 'right' : 'wrong');
    if (right) onDone();
  };
  const reveal = () => {
    setResult('revealed');
    onDone();
  };

  return { sequence, answer, setAnswer, result, steps: walked, play, check, reveal };
}
