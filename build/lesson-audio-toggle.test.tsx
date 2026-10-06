import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { LessonAudioToggle } from '../src/components/lesson/lesson-audio-toggle/lesson-audio-toggle.tsx';

function text(markup: string): string {
  return markup.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

function pressedState(markup: string): string | null {
  return /aria-pressed="([^"]*)"/.exec(markup)?.[1] ?? null;
}

describe('LessonAudioToggle', () => {
  it('offers to turn the sound on while it is off', () => {
    const markup = renderToStaticMarkup(<LessonAudioToggle audioEnabled={false} blocked={false} message={null} onToggle={() => {}} />);
    expect(text(markup)).toBe('Увімкнути звук');
    expect(pressedState(markup)).toBe('false');
  });

  it('offers to turn the sound off while it plays', () => {
    const markup = renderToStaticMarkup(<LessonAudioToggle audioEnabled blocked={false} message={null} onToggle={() => {}} />);
    expect(text(markup)).toBe('Вимкнути звук');
    expect(pressedState(markup)).toBe('true');
  });

  it('offers another attempt after the browser refused the sound, and says why', () => {
    const markup = renderToStaticMarkup(
      <LessonAudioToggle audioEnabled={false} blocked message="Браузер не дозволив увімкнути звук." onToggle={() => {}} />,
    );
    expect(text(markup)).toBe('Спробувати ввімкнути звук Браузер не дозволив увімкнути звук.');
  });

  it('keeps the live region in the tree while there is nothing to say', () => {
    const markup = renderToStaticMarkup(<LessonAudioToggle audioEnabled blocked={false} message={null} onToggle={() => {}} />);
    expect(markup).toContain('aria-live="polite"');
  });
});
