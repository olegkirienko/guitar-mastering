import { useState } from 'react';
import type { EnharmonicPairsContent, EnharmonicPairsProps } from '@/components/lesson/enharmonic-pairs/types';
import { areEnharmonic } from '@/data/lessons/stage-02-lesson-04-model/utils/names';

export function useEnharmonicPairs({ content, left, onSolved }: Pick<EnharmonicPairsProps, 'left' | 'onSolved'> & { content: EnharmonicPairsContent }) {
  // Session-only: which names are joined is never saved.
  const [selected, setSelected] = useState<string | null>(null);
  const [matched, setMatched] = useState<readonly string[]>([]);
  const [lastPair, setLastPair] = useState<{ first: string; second: string; right: boolean } | null>(null);

  const chooseLeft = (name: string) => {
    setSelected(name);
    setLastPair(null);
  };
  const chooseRight = (name: string) => {
    if (selected === null) return;
    const right = areEnharmonic(selected, name);
    setLastPair({ first: selected, second: name, right });
    setSelected(null);
    if (!right) return;
    const next = [...matched, selected];
    setMatched(next);
    if (left.every((item) => next.includes(item))) onSolved();
  };

  const status = lastPair
    ? lastPair.right ? content.matched(lastPair.first, lastPair.second) : content.miss(lastPair.first, lastPair.second)
    : selected !== null ? content.picked(selected) : content.pickFirst;

  return { selected, matched, status, done: left.every((name) => matched.includes(name)), chooseLeft, chooseRight };
}
