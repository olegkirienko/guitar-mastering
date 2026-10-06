import { Toggle } from '@/components/base/toggle/toggle';
import { useAuth } from '@/hooks/use-auth';
import { usePrefersReducedMotion } from '@/hooks/use-prefers-reduced-motion/use-prefers-reduced-motion';
import { audioHint, audioLabel, motionHint, motionLabel, motionSystemHint } from '@/pages/account-page/components/lesson-preferences/constants';

// The lesson switches apply at once and are saved; a failed save switches them back.
export function LessonPreferences() {
  const { preferences, updatePreferences } = useAuth();
  const prefersReducedMotion = usePrefersReducedMotion();
  return <div className="space-y-5">
    <Toggle
      size="md"
      className="w-full"
      aria-label={motionLabel}
      label={motionLabel}
      hint={prefersReducedMotion ? motionSystemHint : motionHint}
      isSelected={prefersReducedMotion || preferences.prefersStatic}
      isDisabled={prefersReducedMotion}
      onChange={(prefersStatic) => void updatePreferences({ prefersStatic })}
    />
    <Toggle
      size="md"
      className="w-full"
      aria-label={audioLabel}
      label={audioLabel}
      hint={audioHint}
      isSelected={preferences.audioEnabled}
      onChange={(audioEnabled) => void updatePreferences({ audioEnabled })}
    />
  </div>;
}
