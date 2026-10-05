import type { Theme } from '@/auth/auth-provider/types';
import { RadioButton, RadioGroup } from '@/components/base/radio-buttons/radio-buttons';
import { preferencesSaveFailedMessage } from '@/constants/preferences';
import { useAuth } from '@/hooks/use-auth';
import { themeOptions } from '@/pages/account-page/components/theme-preference/constants';

// The theme choice applies at once and is saved; a failed save switches it back.
export function ThemePreference({ labelledBy }: { labelledBy: string }) {
  const { preferences, preferencesSaveFailed, updatePreferences } = useAuth();
  return <>
    <RadioGroup aria-labelledby={labelledBy} size="md" value={preferences.theme} onChange={(value) => void updatePreferences({ theme: value as Theme })}>
      {themeOptions.map((option) => <RadioButton key={option.value} value={option.value} label={option.label} hint={option.hint} />)}
    </RadioGroup>
    <p className="mt-3 text-sm text-error-primary" aria-live="polite">{preferencesSaveFailed && preferencesSaveFailedMessage}</p>
  </>;
}
