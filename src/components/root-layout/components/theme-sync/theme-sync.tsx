import { useThemeSync } from '@/components/root-layout/components/theme-sync/hooks/use-theme-sync';

// Applies the learner's theme choice, or the system theme, to the document.
export function ThemeSync() {
  useThemeSync();
  return null;
}
