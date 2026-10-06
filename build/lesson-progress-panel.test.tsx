import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { LessonProgressPanel } from '../src/components/lesson/lesson-progress-panel/lesson-progress-panel.tsx';
import type { SyncSnapshot } from '../src/progress/core/types.ts';

function text(markup: string): string {
  return markup.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

function panel(status: SyncSnapshot['status'], preferencesSaveFailed = false): string {
  return renderToStaticMarkup(
    <LessonProgressPanel sync={{ status, revision: 1, error: null }} retrySync={() => {}} preferencesSaveFailed={preferencesSaveFailed} />,
  );
}

describe('LessonProgressPanel', () => {
  it('says nothing while the lesson saves normally', () => {
    expect(text(panel('idle'))).toBe('');
    expect(text(panel('pending'))).toBe('');
    expect(text(panel('synced'))).toBe('');
  });

  it('reports a save that did not land and offers a retry', () => {
    expect(text(panel('error'))).toBe('Прогрес ще не збережено. Урок працює, але зміни можуть загубитися. Спробувати зберегти ще раз');
  });

  it('reports a preference that was switched back', () => {
    expect(text(panel('synced', true))).toBe('Не вдалося зберегти налаштування, тому повернули попереднє. Спробуй ще раз.');
  });

  it('keeps both live regions in the tree while there is nothing to say', () => {
    expect([...panel('synced').matchAll(/aria-live="polite"/g)]).toHaveLength(2);
  });
});
