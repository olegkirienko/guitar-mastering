import { useLessonProgressPanel } from '@/components/lesson/lesson-progress-panel/hooks/use-lesson-progress-panel';
import { Button } from '@/components/base/buttons/button';
import type { LessonProgressPanelProps } from '@/components/lesson/lesson-progress-panel/types';

// Local and account progress status shared by every lesson page: the storage
// notice, sync status with retry, guest import prompt, and device cache clearing.
export function LessonProgressPanel({
  storageAvailable,
  sync,
  accountState,
  importGuestProgress,
  confirmGuestImport,
  keepGuestProgressSeparate,
  clearCurrentAccountCache,
  retrySync,
}: LessonProgressPanelProps) {
  const { confirmCacheClear, setConfirmCacheClear, cacheClearMessage, setCacheClearMessage } = useLessonProgressPanel();
  return <>
    <div className="mb-4 text-sm text-gray-600" aria-live="polite">
      {!storageAvailable
        ? 'Збереження недоступне — прогрес доступний лише протягом цього сеансу.'
        : accountState === 'authenticated' && sync.status === 'pending'
          ? 'Збережено на цьому пристрої. Синхронізуємо з акаунтом…'
          : accountState === 'authenticated' && sync.status === 'synced'
            ? 'Прогрес збережено на цьому пристрої та в акаунті.'
            : accountState === 'authenticated' && sync.status === 'error'
              ? 'Збережено на цьому пристрої, але синхронізація не вдалася.'
              : accountState === 'unavailable'
                ? 'Прогрес зберігається на цьому пристрої. Сервер зараз недоступний.'
                : accountState === 'loading'
                  ? 'Прогрес зберігається на цьому пристрої. Перевіряємо акаунт…'
                  : 'Прогрес зберігається на цьому пристрої.'}
      {accountState === 'authenticated' && sync.status === 'error' && <Button color="link-color" size="md" className="ml-2" onClick={retrySync}>Повторити синхронізацію</Button>}
    </div>
    {importGuestProgress && <section className="mb-5 rounded-lg border border-brand-200 bg-brand-25 p-4" aria-labelledby="guest-progress-title">
      <h2 id="guest-progress-title" className="font-semibold text-gray-950">Додати прогрес гостя до акаунта?</h2>
      <p className="mt-1 text-sm leading-6 text-gray-700">Ми об’єднаємо пройдені кроки на цьому пристрої з прогресом акаунта. Жоден завершений крок не буде втрачено.</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button size="lg" onClick={confirmGuestImport}>Об’єднати прогрес</Button>
        <Button color="secondary" size="lg" onClick={keepGuestProgressSeparate}>Залишити окремо</Button>
      </div>
    </section>}
    {accountState === 'authenticated' && <section className="mb-5 rounded-lg border border-gray-200 bg-gray-50 p-4" aria-labelledby="device-progress-title">
      <h2 id="device-progress-title" className="font-semibold text-gray-950">Прогрес на спільному пристрої</h2>
      <p className="mt-1 text-sm leading-6 text-gray-600">Можна видалити лише локальну копію прогресу цього акаунта. Прогрес на сервері, гостьовий прогрес та дані інших акаунтів залишаться.</p>
      {!confirmCacheClear ? <Button color="secondary" size="lg" className="mt-3" isDisabled={sync.status === 'pending'} onClick={() => { setCacheClearMessage(null); setConfirmCacheClear(true); }}>{sync.status === 'pending' ? 'Дочекайся синхронізації' : 'Очистити локальну копію'}</Button> : <div className="mt-3" role="group" aria-labelledby="device-progress-confirmation">
        <p id="device-progress-confirmation" className="text-sm font-semibold text-gray-950">Очистити локальну копію прогресу цього акаунта?</p>
        <div className="mt-2 flex flex-wrap gap-2">
          <Button color="primary-destructive" size="lg" isDisabled={sync.status === 'pending'} onClick={() => { const cleared = clearCurrentAccountCache(); setConfirmCacheClear(false); setCacheClearMessage(cleared ? 'Локальну копію цього акаунта видалено. Серверний прогрес залишився.' : 'Не вдалося очистити локальну копію.'); }}>Підтвердити очищення</Button>
          <Button color="tertiary" size="lg" onClick={() => setConfirmCacheClear(false)}>Скасувати</Button>
        </div>
      </div>}
      {cacheClearMessage && <p className="mt-3 text-sm text-gray-700" role="status">{cacheClearMessage}</p>}
    </section>}
  </>;
}
