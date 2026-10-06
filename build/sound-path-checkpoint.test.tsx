import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { SoundPathCheckpoint } from '../src/components/lesson/sound-path-checkpoint/sound-path-checkpoint.tsx';
import { lessonOneContent } from '../src/data/lessons/stage-01-lesson-01/constants.ts';

const content = lessonOneContent.checkpoint;

function render(initiallyPassed: boolean): string {
  return renderToStaticMarkup(<SoundPathCheckpoint content={content} initiallyPassed={initiallyPassed} onComplete={() => {}} />);
}

function text(markup: string): string {
  return markup.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ');
}

function buttonLabels(markup: string): string[] {
  return [...markup.matchAll(/<button[\s\S]*?<\/button>/g)].map((match) => match[0].replace(/<[^>]*>/g, '').trim());
}

describe('SoundPathCheckpoint', () => {
  it('starts with the first link placed and asks for the next one', () => {
    const markup = render(false);
    expect(text(markup)).toContain(content.cards[0].label);
    expect(text(markup)).toContain('Що відбувається далі?');
    expect(text(markup)).not.toContain(content.summary);
  });

  it('does not offer the card it already placed', () => {
    const offered = buttonLabels(render(false));
    expect(offered).not.toContain(content.cards[0].label);
    expect(offered).toEqual(content.initialOrder.filter((id) => id !== content.cards[0].id).map((id) => content.cards.find((card) => card.id === id)!.label));
  });

  it('shows no hint and no reveal before a wrong pick', () => {
    const markup = text(render(false));
    expect(markup).not.toContain('Ще не ця ланка.');
    expect(markup).not.toContain('Показати й пояснити');
  });

  it('shows a returning learner the passed summary instead of the question', () => {
    const markup = render(true);
    expect(text(markup)).toContain(content.passed);
    expect(text(markup)).toContain(content.summary);
    expect(text(markup)).not.toContain('Що відбувається далі?');
    expect(buttonLabels(markup)).toEqual([]);
  });

  it('keeps the dropped reordering controls out of the markup', () => {
    const markup = render(false);
    expect(markup).not.toContain('draggable');
    expect(buttonLabels(markup)).not.toContain('Раніше');
    expect(buttonLabels(markup)).not.toContain('Пізніше');
    expect(buttonLabels(markup)).not.toContain('Перевірити порядок');
  });
});
