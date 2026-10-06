import { Button } from '@/components/base/buttons/button';
import type { LessonAudioToggleProps } from '@/components/lesson/lesson-audio-toggle/types';

// Sound switch for one experiment. The account page holds the default; this turns it on where it plays.
export function LessonAudioToggle({ audioEnabled, blocked, message, onToggle }: LessonAudioToggleProps) {
  return <div className="mt-4">
    <Button color="secondary" size="md" aria-pressed={audioEnabled} onClick={onToggle}>
      {audioEnabled ? 'Вимкнути звук' : blocked ? 'Спробувати ввімкнути звук' : 'Увімкнути звук'}
    </Button>
    <div aria-live="polite" className="mt-2 text-sm leading-6 text-secondary">{message && <p>{message}</p>}</div>
  </div>;
}
