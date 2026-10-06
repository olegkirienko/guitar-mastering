import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { AuthContext } from '../src/auth/auth-provider/constants.ts';
import type { AuthContextValue, Preferences } from '../src/auth/auth-provider/types.ts';
import { LessonPreferences } from '../src/pages/account-page/components/lesson-preferences/lesson-preferences.tsx';

// The switches read the account preferences, so the component is rendered inside a stub context.
function render(preferences: Preferences): string {
  const value = {
    state: 'authenticated', user: null, preferences, preferencesSaveFailed: false,
    refresh: vi.fn(), register: vi.fn(), login: vi.fn(), logout: vi.fn(),
    updateProfile: vi.fn(), updatePreferences: vi.fn(), deleteAccount: vi.fn(),
  } as unknown as AuthContextValue;
  return renderToStaticMarkup(<AuthContext.Provider value={value}><LessonPreferences /></AuthContext.Provider>);
}

function switches(markup: string): { label: string | undefined; checked: boolean; disabled: boolean }[] {
  return [...markup.matchAll(/<input[^>]*role="switch"[^>]*>/g)].map((match) => ({
    label: /aria-label="([^"]*)"/.exec(match[0])?.[1],
    checked: match[0].includes('checked'),
    disabled: match[0].includes('disabled'),
  }));
}

describe('LessonPreferences', () => {
  it('shows one switch per lesson preference, named without its hint', () => {
    expect(switches(render({ audioEnabled: true, prefersStatic: false, theme: 'system' })).map((item) => item.label))
      .toEqual(['Показувати досліди покадрово', 'Звук у дослідах']);
  });

  it('reflects the saved preferences', () => {
    expect(switches(render({ audioEnabled: true, prefersStatic: false, theme: 'system' })).map((item) => item.checked)).toEqual([false, true]);
    expect(switches(render({ audioEnabled: false, prefersStatic: true, theme: 'system' })).map((item) => item.checked)).toEqual([true, false]);
  });

  it('explains that sound never starts on its own', () => {
    expect(render({ audioEnabled: false, prefersStatic: false, theme: 'system' }))
      .toContain('Звук не запускається сам і не потрібен, щоб пройти урок.');
  });
});
