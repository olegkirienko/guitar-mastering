import { useEffect, useRef, useState } from 'react';
import type { OctaveCheckpointProps } from '@/components/lesson/octave-checkpoint/types';
import { isOctaveOf } from '@/data/lessons/stage-02-lesson-01-model/utils/octave';

// The second sound of a pair follows the first after this pause.
const pairGapMs = 900;

export function useOctaveCheckpoint({ content, audio, gain, onPass }: Pick<OctaveCheckpointProps, 'content' | 'audio' | 'gain' | 'onPass'>) {
  // Session-only: only the fact of passing is saved, never the answers or the attempts.
  const [foundIds, setFoundIds] = useState<readonly string[]>([]);
  const [selected, setSelected] = useState<readonly string[]>([]);
  const [pairsChecked, setPairsChecked] = useState(false);
  const [pairsRight, setPairsRight] = useState(false);

  const gapTimer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(gapTimer.current), []);

  const pass = (nextFound: readonly string[], nextPairsRight: boolean) => {
    if (nextPairsRight && content.find.every((task) => nextFound.includes(task.id))) onPass();
  };

  // The answer is judged by the model, not by the id stored in the content.
  const answerFind = (taskId: string, choiceId: string) => {
    if (!isOctaveOf(content.base, Number(choiceId)) || foundIds.includes(taskId)) return;
    const nextFound = [...foundIds, taskId];
    setFoundIds(nextFound);
    pass(nextFound, pairsRight);
  };

  const togglePair = (id: string, isSelected: boolean) => {
    setPairsChecked(false);
    setSelected((current) => (isSelected ? [...current.filter((item) => item !== id), id] : current.filter((item) => item !== id)));
  };

  const checkPairs = () => {
    const right = content.pairs.items.every((pair) => selected.includes(pair.id) === isOctaveOf(pair.low, pair.high));
    setPairsChecked(true);
    setPairsRight(right);
    if (right) pass(foundIds, true);
  };

  const listenPair = (low: number, high: number) => {
    window.clearTimeout(gapTimer.current);
    audio.playTone(low, gain);
    gapTimer.current = window.setTimeout(() => audio.playTone(high, gain), pairGapMs);
  };

  return { listenPair, selected, pairsChecked, pairsRight, answerFind, togglePair, checkPairs, foundIds };
}
