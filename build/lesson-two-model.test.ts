import { describe, expect, it } from 'vitest';
import {
  chainAttemptOutcome,
  chainIsCorrect,
  checkpointPassed,
  correctAdjacentLinks,
  correctChain,
  initialChain,
  moveCard,
  advanceElapsed,
  comparisonDurationMs,
  comparisonMoments,
  comparisonRepeats,
  completedRepeats,
  labFeedback,
  labFrequencies,
  loudnessGain,
  momentFraction,
  peakGainCap,
  pitchChange,
  safeGain,
  stepFrequency,
  toneGain,
  trackOffset,
  visualCycles,
} from '../src/data/lessons/stage-01-lesson-02-model.ts';

describe('Lesson 2 repeat comparison', () => {
  it('ends with 4 and 8 full repeats in the same time window', () => {
    expect(completedRepeats(comparisonRepeats.a, 1)).toBe(4);
    expect(completedRepeats(comparisonRepeats.b, 1)).toBe(8);
    expect(completedRepeats(comparisonRepeats.b, 1.5)).toBe(8);
  });

  it('accumulates repeats moment by moment on one shared timer', () => {
    const table = Array.from({ length: comparisonMoments + 1 }, (_, moment) => [
      completedRepeats(comparisonRepeats.a, momentFraction(moment)),
      completedRepeats(comparisonRepeats.b, momentFraction(moment)),
    ]);
    expect(table[0]).toEqual([0, 0]);
    expect(table[4]).toEqual([1, 2]);
    expect(table[comparisonMoments]).toEqual([4, 8]);
    table.forEach(([a, b]) => expect(b).toBe(2 * a + (b % 2)));
  });

  it('pauses on long gaps between frames instead of jumping to the end', () => {
    expect(advanceElapsed(0, 16)).toBe(16);
    expect(advanceElapsed(1000, 60_000)).toBe(1050);
    expect(advanceElapsed(1000, -5)).toBe(1000);
    expect(advanceElapsed(comparisonDurationMs - 10, 40)).toBe(comparisonDurationMs);
  });

  it('moves both dots through visibly different positions in step mode', () => {
    const positionsA = new Set(Array.from({ length: comparisonMoments }, (_, moment) => trackOffset(4, momentFraction(moment)).toFixed(2)));
    const positionsB = new Set(Array.from({ length: comparisonMoments }, (_, moment) => trackOffset(8, momentFraction(moment)).toFixed(2)));
    expect(positionsA.size).toBeGreaterThan(1);
    expect(positionsB.size).toBeGreaterThan(1);
  });
});

describe('Lesson 2 frequency lab', () => {
  it('moves only between the discrete values and stops at the ends', () => {
    expect(stepFrequency(220, 1)).toBe(330);
    expect(stepFrequency(330, 1)).toBe(440);
    expect(stepFrequency(440, 1)).toBe(440);
    expect(stepFrequency(220, -1)).toBe(220);
    expect([...labFrequencies]).toEqual([220, 330, 440]);
  });

  it('compares the previous and new values in its feedback', () => {
    expect(pitchChange(220, 330)).toBe('higher');
    expect(pitchChange(440, 330)).toBe('lower');
    expect(pitchChange(330, 330)).toBe('same');
    expect(labFeedback(220, 330)).toBe('220 → 330: за секунду повторів стало більше, тому звук став вищим.');
    expect(labFeedback(440, 220)).toContain('нижчим');
  });

  it('draws denser repeats for higher values without changing their height', () => {
    expect(visualCycles(220)).toBeLessThan(visualCycles(330));
    expect(visualCycles(330)).toBeLessThan(visualCycles(440));
  });
});

describe('Lesson 2 audio safety', () => {
  it('never exceeds the Lesson 1 peak gain', () => {
    for (const gain of [...Object.values(toneGain), loudnessGain.quiet, loudnessGain.loud]) {
      expect(gain).toBeLessThanOrEqual(peakGainCap);
    }
    expect(safeGain(5)).toBe(peakGainCap);
    expect(safeGain(-1)).toBeGreaterThan(0);
    expect(loudnessGain.loud).toBeGreaterThan(loudnessGain.quiet);
  });
});

describe('Lesson 2 checkpoint chain', () => {
  it('starts wrong everywhere and reaches the correct order with earlier/later moves', () => {
    expect(initialChain.every((card, index) => card !== correctChain[index])).toBe(true);
    let order = [...initialChain];
    order = moveCard(order, 0, 1);
    order = moveCard(order, 1, 1);
    expect(order).toEqual(['repeats', 'frequency', 'pitch']);
    expect(chainIsCorrect(order)).toBe(true);
    expect(moveCard(order, 0, -1)).toEqual(order);
    expect(moveCard(order, 2, 1)).toEqual(order);
  });

  it('marks only the correct adjacent links', () => {
    expect(correctAdjacentLinks(['pitch', 'repeats', 'frequency'])).toEqual([false, true]);
    expect(correctAdjacentLinks(['frequency', 'pitch', 'repeats'])).toEqual([true, false]);
    expect(correctAdjacentLinks(['repeats', 'frequency', 'pitch'])).toEqual([true, true]);
  });

  it('hints first, then offers the explanation, and passes only with the counterexample', () => {
    expect(chainAttemptOutcome(['pitch', 'repeats', 'frequency'], 0)).toBe('hint');
    expect(chainAttemptOutcome(['pitch', 'repeats', 'frequency'], 1)).toBe('offer-explanation');
    expect(chainAttemptOutcome([...correctChain], 3)).toBe('correct');
    expect(checkpointPassed(true, true)).toBe(true);
    expect(checkpointPassed(true, false)).toBe(false);
    expect(checkpointPassed(false, true)).toBe(false);
  });
});
