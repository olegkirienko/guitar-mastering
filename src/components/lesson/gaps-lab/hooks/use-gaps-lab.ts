import { useState } from 'react';
import type { GapsLabProps } from '@/components/lesson/gaps-lab/types';
import { gradePicked } from '@/components/lesson/gaps-lab/utils/grading';

export function useGapsLab({ onSolved }: Pick<GapsLabProps, 'onSolved'>) {
  // Session-only: nothing picked here is saved.
  const [picked, setPicked] = useState<readonly number[]>([]);
  const [verdict, setVerdict] = useState<'right' | 'wrong' | null>(null);
  const [explained, setExplained] = useState(false);

  const found = verdict === 'right';
  const report = (nextFound: boolean, nextExplained: boolean) => {
    if (nextFound && nextExplained) onSolved();
  };

  const toggle = (index: number) => {
    setVerdict(null);
    setPicked((current) => current.includes(index) ? current.filter((candidate) => candidate !== index) : [...current, index]);
  };
  const check = () => {
    const right = gradePicked(picked);
    setVerdict(right ? 'right' : 'wrong');
    report(right, explained);
  };
  const explain = (_choiceId: string, isCorrect: boolean) => {
    if (!isCorrect) return;
    setExplained(true);
    report(found, true);
  };

  return { picked, toggle, verdict, check, found, explained, explain };
}
