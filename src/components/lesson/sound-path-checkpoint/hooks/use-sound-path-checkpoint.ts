import type { SequenceResult, SoundPathCheckpointProps } from '@/components/lesson/sound-path-checkpoint/types';
import { type DragEvent, useId, useState } from 'react';

export function useSoundPathCheckpoint({ content, initiallyPassed }: Pick<SoundPathCheckpointProps, 'content' | 'initiallyPassed'>) {
  const [order, setOrder] = useState<string[]>(initiallyPassed ? content.cards.map((card) => card.id) : [...content.initialOrder]);
  const [attempts, setAttempts] = useState(0);
  const [result, setResult] = useState<SequenceResult>(initiallyPassed ? 'correct' : 'idle');
  const [announcement, setAnnouncement] = useState('');
  const [passed, setPassed] = useState(initiallyPassed);
  const feedbackId = useId();
  const expectedOrder = content.cards.map((card) => card.id);
  const sequenceReady = result === 'correct' || result === 'explained';

  const moveCard = (cardId: string, targetIndex: number) => {
    const currentIndex = order.indexOf(cardId);
    const boundedIndex = Math.max(0, Math.min(targetIndex, order.length - 1));
    if (currentIndex === boundedIndex) return;
    const nextOrder = [...order];
    nextOrder.splice(currentIndex, 1);
    nextOrder.splice(boundedIndex, 0, cardId);
    setOrder(nextOrder);
    setResult('idle');
    const card = content.cards.find((item) => item.id === cardId);
    setAnnouncement(`${card?.label ?? 'Картку'} переміщено на позицію ${boundedIndex + 1} із ${order.length}.`);
  };

  const handleDragStart = (event: DragEvent<HTMLLIElement>, cardId: string) => {
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', cardId);
  };

  const handleDrop = (event: DragEvent<HTMLLIElement>, targetIndex: number) => {
    event.preventDefault();
    const cardId = event.dataTransfer.getData('text/plain');
    if (order.includes(cardId)) moveCard(cardId, targetIndex);
  };

  const checkSequence = () => {
    const isCorrect = order.every((cardId, index) => cardId === expectedOrder[index]);
    setAttempts((current) => current + 1);
    setResult(isCorrect ? 'correct' : 'incorrect');
  };

  const showSequence = () => {
    setOrder(expectedOrder);
    setResult('explained');
    setAnnouncement('Правильний причинний порядок показано й пояснено.');
  };

  const firstBreakIndex = expectedOrder.findIndex((cardId, index) => order[index] !== cardId);
  const hint = content.breakHints[Math.max(firstBreakIndex, 0)];

  return { order, attempts, result, announcement, passed, setPassed, feedbackId, expectedOrder, sequenceReady, moveCard, handleDragStart, handleDrop, checkSequence, showSequence, hint };
}
