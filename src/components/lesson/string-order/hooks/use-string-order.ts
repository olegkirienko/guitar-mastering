import { useState } from 'react';
import type { StringOrderProps } from '@/components/lesson/string-order/types';

export function useStringOrder({ start, correct, onSubmit }: Pick<StringOrderProps, 'start' | 'correct' | 'onSubmit'>) {
  // Session-only: the order and the verdict are never saved.
  const [order, setOrder] = useState<readonly number[]>(start);
  const [verdict, setVerdict] = useState<boolean | null>(null);

  const move = (index: number, delta: -1 | 1) => {
    const target = index + delta;
    if (target < 0 || target >= order.length) return;
    const next = [...order];
    [next[index], next[target]] = [next[target], next[index]];
    setOrder(next);
    setVerdict(null);
  };
  const check = () => {
    setVerdict(order.every((number, index) => number === correct[index]));
    onSubmit();
  };

  return { order, verdict, move, check };
}
