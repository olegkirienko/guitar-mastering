import type { GuitarApplicationProps } from '@/components/lesson/guitar-application/types';
import { useState } from 'react';

export function useGuitarApplication({ completed }: Pick<GuitarApplicationProps, 'completed'>) {
  const [predicted, setPredicted] = useState(completed);
  const [experienced, setExperienced] = useState(completed);
  const [help, setHelp] = useState<'none' | 'no-difference' | 'buzz'>('none');
  const [concluded, setConcluded] = useState(completed);
  const showHelp = (kind: 'no-difference' | 'buzz') => {
    setHelp(kind);
    setExperienced(true);
  };

  return { predicted, setPredicted, experienced, setExperienced, help, concluded, setConcluded, showHelp };
}
