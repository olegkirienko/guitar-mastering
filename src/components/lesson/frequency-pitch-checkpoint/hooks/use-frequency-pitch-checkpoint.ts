import type { FrequencyPitchCheckpointProps } from '@/components/lesson/frequency-pitch-checkpoint/types';
import { correctChain, initialChain } from '@/data/lessons/stage-01-lesson-02-model/constants';
import type { ChainAttemptOutcome, ChainCard } from '@/data/lessons/stage-01-lesson-02-model/types';
import { chainAttemptOutcome, checkpointPassed, correctAdjacentLinks, moveCard } from '@/data/lessons/stage-01-lesson-02-model/utils/chain';
import { useEffect, useRef, useState } from 'react';

export function useFrequencyPitchCheckpoint({ content, passed, onPass }: FrequencyPitchCheckpointProps) {
  const [order, setOrder] = useState<ChainCard[]>(passed ? [...correctChain] : [...initialChain]);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [outcome, setOutcome] = useState<ChainAttemptOutcome | null>(passed ? 'correct' : null);
  const [explained, setExplained] = useState(false);
  const [counterCorrect, setCounterCorrect] = useState(passed);
  const [focusMove, setFocusMove] = useState<{ card: ChainCard; direction: 'earlier' | 'later' } | null>(null);
  const [moveMessage, setMoveMessage] = useState('');
  const moveButtons = useRef(new Map<string, HTMLButtonElement>());
  const chainStatus = useRef<HTMLDivElement>(null);
  const focusStatusWhenDone = useRef(false);
  const reported = useRef(passed);
  const chainDone = outcome === 'correct' || explained;
  const links = correctAdjacentLinks(order);

  useEffect(() => {
    if (!focusMove) return;
    moveButtons.current.get(`${focusMove.card}-${focusMove.direction}`)?.focus();
    setFocusMove(null);
  }, [focusMove]);

  // The check and explain buttons disappear once the chain is done, so focus
  // moves to the result instead of dropping to the page.
  useEffect(() => {
    if (!chainDone || !focusStatusWhenDone.current) return;
    focusStatusWhenDone.current = false;
    chainStatus.current?.focus();
  }, [chainDone]);

  useEffect(() => {
    if (reported.current || !checkpointPassed(chainDone, counterCorrect)) return;
    reported.current = true;
    onPass();
  }, [chainDone, counterCorrect, onPass]);

  const move = (index: number, direction: -1 | 1) => {
    if (chainDone) return;
    const target = index + direction;
    if (target < 0 || target >= order.length) return;
    setOrder(moveCard(order, index, direction));
    setOutcome(null);
    setFocusMove({ card: order[index], direction: direction === -1 ? 'earlier' : 'later' });
    setMoveMessage(`«${content.cards[order[index]]}» — ${content.movedToLabel} ${target + 1} ${content.ofLabel} ${order.length}.`);
  };
  const checkOrder = () => {
    const result = chainAttemptOutcome(order, failedAttempts);
    if (result === 'correct') focusStatusWhenDone.current = true;
    setOutcome(result);
    if (result !== 'correct') setFailedAttempts((count) => count + 1);
  };
  const explain = () => {
    focusStatusWhenDone.current = true;
    setOrder([...correctChain]);
    setExplained(true);
  };

  return { order, outcome, explained, counterCorrect, setCounterCorrect, moveMessage, moveButtons, chainStatus, chainDone, links, move, checkOrder, explain };
}
