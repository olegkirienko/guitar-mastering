// The chain is built forward: `chain` holds the links already attached, in the correct order,
// and `expectedOrder` is the correct order of every card.

// `initialOrder` is a permutation of all cards, so the already attached links are filtered out.
export function offeredCards(initialOrder: readonly string[], chain: readonly string[]): string[] {
  return initialOrder.filter((cardId) => !chain.includes(cardId));
}

export function expectedNextCard(expectedOrder: readonly string[], chain: readonly string[]): string | undefined {
  return expectedOrder[chain.length];
}

export function isCorrectPick(expectedOrder: readonly string[], chain: readonly string[], cardId: string): boolean {
  return cardId === expectedNextCard(expectedOrder, chain);
}

// One hint per position; the last one stands in when a lesson ships fewer hints than cards.
export function hintForNextLink(breakHints: readonly string[], chain: readonly string[]): string {
  return breakHints[Math.min(chain.length, breakHints.length - 1)] ?? '';
}

// The escape opens after two wrong picks on the same link.
export function canRevealNextLink(attempts: number): boolean {
  return attempts >= 2;
}
