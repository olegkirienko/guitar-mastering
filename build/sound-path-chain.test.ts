import { describe, expect, it } from 'vitest';
import { canRevealNextLink, expectedNextCard, hintForNextLink, isCorrectPick, offeredCards } from '../src/components/lesson/sound-path-checkpoint/utils/chain.ts';
import { lessonOneContent } from '../src/data/lessons/stage-01-lesson-01/constants.ts';
import { lessonFiveContent } from '../src/data/lessons/stage-01-lesson-05/constants.ts';

const checkpoints = [
  ['lesson 1', lessonOneContent.checkpoint],
  ['lesson 5', lessonFiveContent.path.checkpoint],
] as const;

describe.each(checkpoints)('%s sound path chain', (_name, content) => {
  const order = content.cards.map((card) => card.id);
  const start = order.slice(0, 1);

  it('offers every card except the one already placed', () => {
    expect(offeredCards(content.initialOrder, start)).toEqual(content.initialOrder.filter((id) => id !== order[0]));
    expect(offeredCards(content.initialOrder, start)).not.toContain(order[0]);
    expect(offeredCards(content.initialOrder, start)).toHaveLength(order.length - 1);
  });

  it('offers the unplaced cards in the order `initialOrder` gives, so the walk is deterministic', () => {
    const chain = order.slice(0, 2);
    expect(offeredCards(content.initialOrder, chain)).toEqual(content.initialOrder.filter((id) => !chain.includes(id)));
  });

  it('accepts the next link and refuses every other card', () => {
    let chain: string[] = [...start];
    while (chain.length < order.length) {
      const next = expectedNextCard(order, chain);
      expect(next).toBe(order[chain.length]);
      for (const cardId of offeredCards(content.initialOrder, chain)) {
        expect(isCorrectPick(order, chain, cardId)).toBe(cardId === next);
      }
      chain = [...chain, next!];
    }
    expect(chain).toEqual(order);
    expect(expectedNextCard(order, chain)).toBeUndefined();
  });

  it('hints at the link being attached, never past the end of the hint list', () => {
    for (let length = 1; length < order.length; length += 1) {
      const chain = order.slice(0, length);
      expect(hintForNextLink(content.breakHints, chain)).toBe(content.breakHints[Math.min(length, content.breakHints.length - 1)]);
      expect(hintForNextLink(content.breakHints, chain)).toBeTruthy();
    }
  });

  it('keeps `initialOrder` a permutation of the cards', () => {
    expect([...content.initialOrder].sort()).toEqual([...order].sort());
  });
});

describe('the reveal escape', () => {
  it('opens only after two wrong picks on the same link', () => {
    expect(canRevealNextLink(0)).toBe(false);
    expect(canRevealNextLink(1)).toBe(false);
    expect(canRevealNextLink(2)).toBe(true);
  });
});

describe('lesson 1 chain wording', () => {
  it('reads as the course-map chain and names no part of the guitar the lesson has not shown', () => {
    expect(lessonOneContent.checkpoint.cards.map((card) => card.id)).toEqual(['string', 'air', 'wave', 'ear', 'perception']);
    for (const card of lessonOneContent.checkpoint.cards) expect(card.label).not.toMatch(/гітар/i);
  });
});
