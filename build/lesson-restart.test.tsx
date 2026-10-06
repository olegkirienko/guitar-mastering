import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { LessonRestart } from '../src/components/lesson/lesson-restart/lesson-restart.tsx';
import {
  restartCancelLabel, restartConfirmLabel, restartExplanation, restartTitle, restartTriggerLabel,
} from '../src/components/lesson/lesson-restart/constants.ts';

function text(markup: string): string {
  return markup.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

describe('LessonRestart', () => {
  it('offers to start over without showing the confirmation yet', () => {
    const markup = renderToStaticMarkup(<LessonRestart onConfirm={async () => {}} />);
    expect(text(markup)).toBe(restartTriggerLabel);
    expect(markup).not.toContain(restartTitle);
  });

  it('warns that the lessons after this one are cleared too', () => {
    // The learner reads this before an irreversible step: it has to name the later lessons.
    expect(restartExplanation).toContain('всіх наступних');
    expect(restartConfirmLabel).not.toBe(restartCancelLabel);
  });
});
