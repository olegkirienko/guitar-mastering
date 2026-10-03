import type { ChoiceQuestionProps } from '@/components/lesson/choice-question/types';
import { useId, useState } from 'react';

export function useChoiceQuestion({ choices, correctChoiceId }: Pick<ChoiceQuestionProps, 'choices' | 'correctChoiceId'>) {
  const [selectedId, setSelectedId] = useState<string>();
  const [checked, setChecked] = useState(false);
  const id = useId();
  const selected = choices.find((choice) => choice.id === selectedId);
  const isCorrect = selectedId === correctChoiceId;

  return { selectedId, setSelectedId, checked, setChecked, id, selected, isCorrect };
}
