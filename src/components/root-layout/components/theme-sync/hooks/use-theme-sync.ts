import { useLayoutEffect, useSyncExternalStore } from 'react';
import { darkSchemeQuery, themeColors } from '@/components/root-layout/components/theme-sync/constants';
import { useAuth } from '@/hooks/use-auth';

function subscribeToSystemScheme(onChange: () => void) {
  const query = window.matchMedia(darkSchemeQuery);
  query.addEventListener('change', onChange);
  return () => query.removeEventListener('change', onChange);
}

function systemPrefersDark() {
  return window.matchMedia(darkSchemeQuery).matches;
}

export function useThemeSync() {
  const choice = useAuth().user?.preferences.theme;
  const systemDark = useSyncExternalStore(subscribeToSystemScheme, systemPrefersDark);
  const dark = choice === 'dark' || (choice !== 'light' && systemDark);
  // A layout effect, so the class changes in the commit that brings the session result, before it is painted.
  useLayoutEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('dark-mode', dark);
    root.style.colorScheme = dark ? 'dark' : 'light';
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', dark ? themeColors.dark : themeColors.light);
  }, [dark]);
}
