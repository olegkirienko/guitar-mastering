import type { SoundPathCheckpointProps } from '@/components/lesson/sound-path-checkpoint/types';
import { expectedNextCard, hintForNextLink, isCorrectPick, offeredCards } from '@/components/lesson/sound-path-checkpoint/utils/chain';
import { useEffect, useId, useRef, useState } from 'react';

export function useSoundPathCheckpoint({ content, initiallyPassed }: Pick<SoundPathCheckpointProps, 'content' | 'initiallyPassed'>) {
  const expectedOrder = content.cards.map((card) => card.id);
  // The first link is placed for the learner; a returning learner gets the whole chain.
  const [chain, setChain] = useState<string[]>(initiallyPassed ? expectedOrder : expectedOrder.slice(0, 1));
  const [attempts, setAttempts] = useState(0);
  const [explained, setExplained] = useState(false);
  const [announcement, setAnnouncement] = useState('');
  const [passed, setPassed] = useState(initiallyPassed);
  const feedbackId = useId();
  const questionId = useId();
  const questionRef = useRef<HTMLHeadingElement>(null);
  const summaryRef = useRef<HTMLParagraphElement>(null);
  const attachedRef = useRef(false);

  const isComplete = chain.length === expectedOrder.length;
  const expectedNext = expectedNextCard(expectedOrder, chain);
  const offered = offeredCards(content.initialOrder, chain);
  const hint = hintForNextLink(content.breakHints, chain);
  const labelOf = (cardId: string) => content.cards.find((card) => card.id === cardId)?.label ?? cardId;

  // Focus follows the chain: the next question after an attach, the summary after the last link.
  useEffect(() => {
    if (!attachedRef.current) return;
    attachedRef.current = false;
    (isComplete ? summaryRef.current : questionRef.current)?.focus();
  }, [chain, isComplete]);

  const attach = (cardId: string, wasExplained: boolean) => {
    const position = chain.length + 1;
    attachedRef.current = true;
    setChain((current) => [...current, cardId]);
    setAttempts(0);
    if (wasExplained) setExplained(true);
    setAnnouncement(position === expectedOrder.length
      ? `${labelOf(cardId)} — ланка ${position} із ${expectedOrder.length}. Ланцюг зібрано.`
      : `${labelOf(cardId)} — ланка ${position} із ${expectedOrder.length}.`);
  };

  const pick = (cardId: string) => {
    if (isCorrectPick(expectedOrder, chain, cardId)) return attach(cardId, false);
    setAttempts((current) => current + 1);
    setAnnouncement(`${labelOf(cardId)} — не наступна ланка. ${hint}`);
  };

  const revealNext = () => {
    if (expectedNext) attach(expectedNext, true);
  };

  return { chain, attempts, explained, announcement, passed, setPassed, feedbackId, questionId, questionRef, summaryRef, expectedOrder, isComplete, offered, hint, pick, revealNext, labelOf };
}
