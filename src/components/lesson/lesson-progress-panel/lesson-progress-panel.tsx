import { Button } from '@/components/base/buttons/button';
import { preferencesSaveFailedMessage } from '@/constants/preferences';
import type { LessonProgressPanelProps } from '@/components/lesson/lesson-progress-panel/types';

// Account status shared by every lesson page. Saving quietly is the normal case, so only the
// failures speak: a progress save that did not land, and a lesson preference switched back.
export function LessonProgressPanel({ sync, retrySync, preferencesSaveFailed }: LessonProgressPanelProps) {
  return <>
  <div className="mb-4 text-sm text-error-primary" aria-live="polite">
    {sync.status === 'error' && <>
      Прогрес ще не збережено. Урок працює, але зміни можуть загубитися.
      <Button color="link-color" size="md" className="ml-2 min-h-11" onClick={retrySync}>Спробувати зберегти ще раз</Button>
    </>}
  </div>
  <div className="mb-4 text-sm text-error-primary" aria-live="polite">
    {preferencesSaveFailed && preferencesSaveFailedMessage}
  </div>
  </>;
}
