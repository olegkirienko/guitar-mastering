import type { Theme } from '@/auth/auth-provider/types';

export const themeOptions: readonly { value: Theme; label: string; hint?: string }[] = [
  { value: 'system', label: 'Системна', hint: 'Як у налаштуваннях пристрою' },
  { value: 'light', label: 'Світла' },
  { value: 'dark', label: 'Темна' },
];
