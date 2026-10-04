import { Button } from '@/components/base/buttons/button';
import type { LessonProgressPanelProps } from '@/components/lesson/lesson-progress-panel/types';

// Account status shared by every lesson page: one progress line with a retry when a save fails,
// and a notice when a lesson preference could not be saved and was switched back.
export function LessonProgressPanel({ sync, retrySync, preferencesSaveFailed }: LessonProgressPanelProps) {
  return <>
  <div className={sync.status === 'error' ? 'mb-4 text-sm text-error-primary' : 'mb-4 text-sm text-gray-600'} aria-live="polite">
    {sync.status === 'pending'
      ? 'Зберігаємо прогрес в акаунті…'
      : sync.status === 'error'
        ? 'Прогрес ще не збережено. Урок працює, але зміни можуть загубитися.'
        : 'Прогрес зберігається в акаунті.'}
    {sync.status === 'error' && <Button color="link-color" size="md" className="ml-2 min-h-11" onClick={retrySync}>Спробувати зберегти ще раз</Button>}
  </div>
  <div className="mb-4 text-sm text-error-primary" aria-live="polite">
    {preferencesSaveFailed && 'Не вдалося зберегти налаштування, тому повернули попереднє. Спробуй ще раз.'}
  </div>
  </>;
}
