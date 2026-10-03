import { correctChain } from '@/data/lessons/stage-01-lesson-02-model/constants';
import type { ChainAttemptOutcome, ChainCard } from '@/data/lessons/stage-01-lesson-02-model/types';

export function moveCard(order: readonly ChainCard[], index: number, direction: -1 | 1): ChainCard[] {
  const target = index + direction;
  if (index < 0 || index >= order.length || target < 0 || target >= order.length) return [...order];
  const next = [...order];
  [next[index], next[target]] = [next[target], next[index]];
  return next;
}

export function chainIsCorrect(order: readonly ChainCard[]): boolean {
  return order.length === correctChain.length && order.every((card, index) => card === correctChain[index]);
}

// For each adjacent pair, whether it is one of the correct links.
export function correctAdjacentLinks(order: readonly ChainCard[]): boolean[] {
  return order.slice(0, -1).map((card, index) => correctChain.indexOf(card) + 1 === correctChain.indexOf(order[index + 1]));
}

// First failed order shows the hint; later failures offer the explanation.
export function chainAttemptOutcome(order: readonly ChainCard[], failedAttempts: number): ChainAttemptOutcome {
  if (chainIsCorrect(order)) return 'correct';
  return failedAttempts === 0 ? 'hint' : 'offer-explanation';
}

// Passing needs the chain (built alone or after the explanation) and a correct
// answer to the counterexample asked after it. First tries and audio are optional.
export function checkpointPassed(chainDone: boolean, counterexampleCorrect: boolean): boolean {
  return chainDone && counterexampleCorrect;
}
